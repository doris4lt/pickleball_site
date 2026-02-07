// Third Shot Drop — Isometric court animation
// Renders into a canvas inside a given container element.

(function () {
    var container = document.getElementById('third-shot-container');
    if (!container) return;

    var canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.borderRadius = '8px';
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var width, height;
    var courtColor = '#2d5a27';
    var kitchenColor = '#3a7a33';
    var traces = [];
    var ripples = [];

    var scale = 1.5;
    function updateScale() {
        scale = Math.min(width / 500, window.innerHeight / 600);
        if (width < 768) scale *= 0.95;
    }
    function project(x, y, z) {
        if (z === undefined) z = 0;
        var isoX = (x - y) * Math.cos(Math.PI / 6) * scale;
        var isoY = ((x + y) * Math.sin(Math.PI / 6) - z) * scale;
        return { x: width / 2 + isoX, y: height * 0.55 + isoY };
    }

    var ball = {
        x: 0, y: 0, z: 0,
        startX: 0, startY: 0,
        bounceX: 0, bounceY: 0,
        targetX: 0, targetY: 0,
        progress: 1, speed: 0.012,
        radius: 6, color: '#efff00',
        state: 'flying', tNet: 0.5, peakZ: 60
    };

    var kitchenLen = 63;
    var serviceLen = 135;
    var courtHalfLen = kitchenLen + serviceLen;
    var courtWidth = 90;
    var netHeight = 32;

    var paddles = {
        top: { x: 0, y: 0, targetX: 0, currentX: 0, yPos: -kitchenLen - 12 },
        bottom: { x: 0, y: 0, targetX: 0, currentX: 0, yPos: courtHalfLen - 8 }
    };

    function resize() {
        var rect = container.getBoundingClientRect();
        var dpr = window.devicePixelRatio || 1;
        width = rect.width;
        height = width * 0.85;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        updateScale();
    }

    function resetBall() {
        ball.x = 0;
        ball.y = paddles.bottom.yPos;
        ball.progress = 1;
        planNextShot();
    }

    function planNextShot() {
        traces = [];
        ball.startX = ball.x;
        ball.startY = ball.y;
        ball.progress = 0;
        ball.state = 'flying';

        var isRedHitting = ball.startY > 0;
        var nextYDir = isRedHitting ? -1 : 1;

        if (isRedHitting) {
            ball.bounceX = (Math.random() - 0.5) * courtWidth * 1.2;
            ball.bounceY = nextYDir * (Math.random() * (kitchenLen - 25) + 10);
            ball.speed = 0.009;
        } else {
            ball.bounceX = (Math.random() - 0.5) * courtWidth * 1.5;
            ball.bounceY = nextYDir * (courtHalfLen - (Math.random() * 40 + 10));
            ball.speed = 0.016;
        }

        var nextSide = isRedHitting ? 'top' : 'bottom';
        var contactLineY = isRedHitting ? (-kitchenLen - 12) : (courtHalfLen - 8);

        ball.targetX = ball.bounceX + (ball.bounceX - ball.startX) * 0.1;
        ball.targetY = contactLineY;

        ball.tNet = Math.abs(ball.startY) / (Math.abs(ball.startY) + Math.abs(ball.bounceY));
        var minH = (netHeight + 18) / (4 * ball.tNet * (1 - ball.tNet));
        ball.peakZ = isRedHitting ? Math.max(minH, 75) : Math.max(minH, 45);

        paddles[nextSide].targetX = ball.targetX;
    }

    function drawCourt() {
        ctx.clearRect(0, 0, width, height);
        var p1 = project(-courtWidth, -courtHalfLen);
        var p2 = project(courtWidth, -courtHalfLen);
        var p3 = project(courtWidth, courtHalfLen);
        var p4 = project(-courtWidth, courtHalfLen);
        ctx.fillStyle = courtColor;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath(); ctx.fill();
        var drawKitchen = function(yStart, yEnd) {
            var k1 = project(-courtWidth, yStart);
            var k2 = project(courtWidth, yStart);
            var k3 = project(courtWidth, yEnd);
            var k4 = project(-courtWidth, yEnd);
            ctx.fillStyle = kitchenColor;
            ctx.beginPath(); ctx.moveTo(k1.x, k1.y); ctx.lineTo(k2.x, k2.y); ctx.lineTo(k3.x, k3.y); ctx.lineTo(k4.x, k4.y); ctx.closePath(); ctx.fill();
        };
        drawKitchen(-kitchenLen, 0);
        drawKitchen(0, kitchenLen);
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath(); ctx.stroke();
        var kl1 = project(-courtWidth, -kitchenLen); var kl2 = project(courtWidth, -kitchenLen);
        ctx.beginPath(); ctx.moveTo(kl1.x, kl1.y); ctx.lineTo(kl2.x, kl2.y); ctx.stroke();
        var kl3 = project(-courtWidth, kitchenLen); var kl4 = project(courtWidth, kitchenLen);
        ctx.beginPath(); ctx.moveTo(kl3.x, kl3.y); ctx.lineTo(kl4.x, kl4.y); ctx.stroke();
        var scl1 = project(0, -kitchenLen); var scl2 = project(0, -courtHalfLen);
        ctx.beginPath(); ctx.moveTo(scl1.x, scl1.y); ctx.lineTo(scl2.x, scl2.y); ctx.stroke();
        var scl3 = project(0, kitchenLen); var scl4 = project(0, courtHalfLen);
        ctx.beginPath(); ctx.moveTo(scl3.x, scl3.y); ctx.lineTo(scl4.x, scl4.y); ctx.stroke();
    }

    function drawNet() {
        var xStart = -courtWidth - 10, xEnd = courtWidth + 10;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        for (var x = xStart; x <= xEnd; x += 8) {
            var bot = project(x, 0, 0); var top = project(x, 0, netHeight);
            ctx.beginPath(); ctx.moveTo(bot.x, bot.y); ctx.lineTo(top.x, top.y); ctx.stroke();
        }
        for (var z = 0; z <= netHeight; z += 8) {
            var left = project(xStart, 0, z); var right = project(xEnd, 0, z);
            ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();
        }
        var n1t = project(xStart, 0, netHeight); var n2t = project(xEnd, 0, netHeight);
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(n1t.x, n1t.y); ctx.lineTo(n2t.x, n2t.y); ctx.stroke();
        var n1b = project(xStart, 0, 0); var n2b = project(xEnd, 0, 0);
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(n1b.x, n1b.y); ctx.lineTo(n1t.x, n1t.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(n2b.x, n2b.y); ctx.lineTo(n2t.x, n2t.y); ctx.stroke();
    }

    function drawRipples() {
        for (var i = ripples.length - 1; i >= 0; i--) {
            var r = ripples[i]; var p = project(r.x, r.y);
            ctx.strokeStyle = 'rgba(255,255,255,' + r.alpha + ')'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(p.x, p.y, r.s, r.s / 2, 0, 0, Math.PI * 2); ctx.stroke();
            r.s += 1.2; r.alpha -= 0.025;
            if (r.alpha <= 0) ripples.splice(i, 1);
        }
    }

    function drawTraces() {
        if (traces.length < 2) return;
        ctx.strokeStyle = 'rgba(239,255,0,0.2)'; ctx.lineWidth = 2;
        ctx.beginPath();
        var start = project(traces[0].x, traces[0].y, traces[0].z);
        ctx.moveTo(start.x, start.y);
        for (var i = 1; i < traces.length; i++) {
            var p = project(traces[i].x, traces[i].y, traces[i].z);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    function drawPaddle(side) {
        var p = paddles[side];
        p.currentX += (p.targetX - p.currentX) * 0.1;
        var pos = project(p.currentX, p.yPos, 12);
        ctx.save(); ctx.translate(pos.x, pos.y);
        ctx.fillStyle = side === 'top' ? '#3b82f6' : '#ef4444';
        ctx.beginPath(); ctx.roundRect(-12, -18, 24, 36, 6); ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#333'; ctx.fillRect(-3, (side === 'top' ? -30 : 18), 6, 12);
        ctx.restore();
    }

    function update() {
        if (ball.progress >= 1) return;
        ball.progress += ball.speed;
        var bounceThreshold = 0.75;
        if (ball.state === 'flying' && ball.progress >= bounceThreshold) {
            ball.state = 'rebounding';
            ripples.push({ x: ball.bounceX, y: ball.bounceY, s: 2, alpha: 1 });
        }
        if (ball.progress >= 1) { ball.progress = 1; planNextShot(); }
        if (ball.state === 'flying') {
            var t = ball.progress / bounceThreshold;
            ball.x = ball.startX + (ball.bounceX - ball.startX) * t;
            ball.y = ball.startY + (ball.bounceY - ball.startY) * t;
            ball.z = 4 * ball.peakZ * t * (1 - t);
        } else {
            var t2 = (ball.progress - bounceThreshold) / (1 - bounceThreshold);
            ball.x = ball.bounceX + (ball.targetX - ball.bounceX) * t2;
            ball.y = ball.bounceY + (ball.targetY - ball.bounceY) * t2;
            ball.z = Math.sin(t2 * (Math.PI / 2)) * 12;
        }
        traces.push({ x: ball.x, y: ball.y, z: ball.z });
    }

    function drawBall() {
        var shadowPos = project(ball.x, ball.y, 0);
        var ballPos = project(ball.x, ball.y, ball.z);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(shadowPos.x, shadowPos.y, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        var size = ball.radius + (ball.z * 0.04);
        var grad = ctx.createRadialGradient(ballPos.x - 2, ballPos.y - 2, 1, ballPos.x, ballPos.y, size);
        grad.addColorStop(0, '#ffffcc'); grad.addColorStop(1, ball.color);
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(ballPos.x, ballPos.y, size, 0, Math.PI * 2); ctx.fill();
    }

    function animate() {
        drawCourt();
        drawRipples();
        drawTraces();
        drawNet();
        drawPaddle('top');
        drawPaddle('bottom');
        update();
        drawBall();
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    resetBall();
    animate();
})();
