// Deep Return of Serve — Isometric court animation
// Renders into a canvas inside a given container element.

(function () {
    var container = document.getElementById('deep-return-container');
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
    var isPaused = false;
    var targetHighlightAlpha = 0;

    var ISO_ANGLE = Math.PI / 6;
    var ISO_COS = Math.cos(ISO_ANGLE);
    var ISO_SIN = Math.sin(ISO_ANGLE);

    var scale = 1.5;
    function updateScale() {
        scale = Math.min(width / 500, window.innerHeight / 600);
        if (width < 768) scale *= 0.95;
    }
    function project(x, y, z) {
        if (z === undefined) z = 0;
        var isoX = (x - y) * ISO_COS * scale;
        var isoY = ((x + y) * ISO_SIN - z) * scale;
        return { x: width / 2 + isoX, y: height * 0.55 + isoY };
    }

    function drawProjectedText(text, x, y, size, color) {
        if (!size) size = 20;
        if (!color) color = 'rgba(255,255,255,0.9)';
        ctx.save();
        var pos = project(x, y, 0);
        ctx.translate(pos.x, pos.y);
        ctx.transform(ISO_COS, ISO_SIN, -ISO_COS, ISO_SIN, 0, 0);
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = color;
        ctx.font = 'bold ' + size + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    var kitchenLen = 63;
    var serviceLen = 135;
    var courtHalfLen = kitchenLen + serviceLen;
    var courtWidth = 90;
    var netHeight = 32;

    var ball = {
        x: 0, y: 0, z: 0,
        startX: 0, startY: 0,
        bounceX: 0, bounceY: 0,
        targetX: 0, targetY: 0,
        progress: 1, speed: 0.012,
        radius: 6, color: '#efff00',
        state: 'flying', peakZ: 60,
        phase: 'serve'
    };

    var paddles = {
        top: { label: 'Server', color: '#3b82f6', x: -45, targetX: -45, currentX: -45, yPos: -courtHalfLen + 5, side: 'even' },
        bottom: { label: 'Receiver', color: '#ef4444', x: 0, targetX: 0, currentX: 0, yPos: courtHalfLen - 20 }
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

    function resetPlay() {
        ball.phase = 'serve';
        ball.x = paddles.top.currentX;
        ball.y = paddles.top.yPos;
        ball.progress = 1;
        planNextShot();
    }

    function planNextShot() {
        traces = [];
        ball.startX = ball.x;
        ball.startY = ball.y;
        ball.progress = 0;
        ball.state = 'flying';

        if (ball.phase === 'serve') {
            var targetXDir = (paddles.top.side === 'even') ? 1 : -1;
            ball.bounceX = (45 * targetXDir) + (Math.random() - 0.5) * 20;
            ball.bounceY = kitchenLen + 50;
            ball.targetX = ball.bounceX + (10 * targetXDir);
            ball.targetY = paddles.bottom.yPos;
            ball.peakZ = 50;
            ball.speed = 0.012;
            paddles.bottom.targetX = ball.targetX;
        } else {
            ball.bounceX = (Math.random() - 0.5) * 60;
            ball.bounceY = -courtHalfLen + 30;
            ball.targetX = ball.bounceX;
            ball.targetY = paddles.top.yPos;
            ball.peakZ = 85;
            ball.speed = 0.01;
            paddles.top.targetX = ball.targetX;
        }
    }

    function drawZones() {
        var avoid1 = project(-courtWidth, -kitchenLen - 60);
        var avoid2 = project(courtWidth, -kitchenLen - 60);
        var avoid3 = project(courtWidth, 0);
        var avoid4 = project(-courtWidth, 0);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.35)';
        ctx.beginPath();
        ctx.moveTo(avoid1.x, avoid1.y); ctx.lineTo(avoid2.x, avoid2.y);
        ctx.lineTo(avoid3.x, avoid3.y); ctx.lineTo(avoid4.x, avoid4.y);
        ctx.closePath(); ctx.fill();

        var target1 = project(-courtWidth + 10, -courtHalfLen + 5);
        var target2 = project(courtWidth - 10, -courtHalfLen + 5);
        var target3 = project(courtWidth - 10, -kitchenLen - 60);
        var target4 = project(-courtWidth + 10, -kitchenLen - 60);
        ctx.fillStyle = 'rgba(50, 255, 50, 0.15)';
        ctx.beginPath();
        ctx.moveTo(target1.x, target1.y); ctx.lineTo(target2.x, target2.y);
        ctx.lineTo(target3.x, target3.y); ctx.lineTo(target4.x, target4.y);
        ctx.closePath(); ctx.fill();

        if (targetHighlightAlpha > 0) {
            ctx.fillStyle = 'rgba(100, 255, 100, ' + targetHighlightAlpha + ')';
            ctx.fill();
            targetHighlightAlpha -= 0.008;
        }

        var shiftY = -20;
        drawProjectedText('AVOID', 0, -kitchenLen / 2 - 25 + shiftY, 24, 'rgba(255, 255, 255, 0.9)');
        drawProjectedText('(SHORT / MID)', 0, -kitchenLen / 2 + 5 + shiftY, 14, 'rgba(255, 255, 255, 0.7)');
        drawProjectedText('TARGET', 0, -courtHalfLen + 45 + shiftY, 24, 'rgba(255, 255, 255, 0.9)');
        drawProjectedText('(DEEP RETURN)', 0, -courtHalfLen + 75 + shiftY, 14, 'rgba(255, 255, 255, 0.7)');
    }

    function drawCourt() {
        ctx.clearRect(0, 0, width, height);
        var p1 = project(-courtWidth, -courtHalfLen);
        var p2 = project(courtWidth, -courtHalfLen);
        var p3 = project(courtWidth, courtHalfLen);
        var p4 = project(-courtWidth, courtHalfLen);
        ctx.fillStyle = courtColor;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
        ctx.closePath(); ctx.fill();

        var drawKitchen = function(yStart, yEnd) {
            var k1 = project(-courtWidth, yStart);
            var k2 = project(courtWidth, yStart);
            var k3 = project(courtWidth, yEnd);
            var k4 = project(-courtWidth, yEnd);
            ctx.fillStyle = kitchenColor;
            ctx.beginPath();
            ctx.moveTo(k1.x, k1.y); ctx.lineTo(k2.x, k2.y); ctx.lineTo(k3.x, k3.y); ctx.lineTo(k4.x, k4.y);
            ctx.closePath(); ctx.fill();
        };
        drawKitchen(-kitchenLen, 0);
        drawKitchen(0, kitchenLen);

        ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
        ctx.closePath(); ctx.stroke();

        var kl1 = project(-courtWidth, -kitchenLen); var kl2 = project(courtWidth, -kitchenLen);
        ctx.beginPath(); ctx.moveTo(kl1.x, kl1.y); ctx.lineTo(kl2.x, kl2.y); ctx.stroke();
        var kl3 = project(-courtWidth, kitchenLen); var kl4 = project(courtWidth, kitchenLen);
        ctx.beginPath(); ctx.moveTo(kl3.x, kl3.y); ctx.lineTo(kl4.x, kl4.y); ctx.stroke();

        var scl1 = project(0, -kitchenLen); var scl2 = project(0, -courtHalfLen);
        ctx.beginPath(); ctx.moveTo(scl1.x, scl1.y); ctx.lineTo(scl2.x, scl2.y); ctx.stroke();
        var scl3 = project(0, kitchenLen); var scl4 = project(0, courtHalfLen);
        ctx.beginPath(); ctx.moveTo(scl3.x, scl3.y); ctx.lineTo(scl4.x, scl4.y); ctx.stroke();

        drawZones();
    }

    function drawNet() {
        var xStart = -courtWidth - 5, xEnd = courtWidth + 5;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
        for (var x = xStart; x <= xEnd; x += 8) {
            var bot = project(x, 0, 0); var top = project(x, 0, netHeight);
            ctx.beginPath(); ctx.moveTo(bot.x, bot.y); ctx.lineTo(top.x, top.y); ctx.stroke();
        }
        for (var z = 0; z <= netHeight; z += 6) {
            var left = project(xStart, 0, z); var right = project(xEnd, 0, z);
            ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();
        }
        var n1t = project(xStart, 0, netHeight); var n2t = project(xEnd, 0, netHeight);
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(n1t.x, n1t.y); ctx.lineTo(n2t.x, n2t.y); ctx.stroke();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 4;
        var p1b = project(xStart, 0, 0); var p1t = project(xStart, 0, netHeight + 2);
        ctx.beginPath(); ctx.moveTo(p1b.x, p1b.y); ctx.lineTo(p1t.x, p1t.y); ctx.stroke();
        var p2b = project(xEnd, 0, 0); var p2t = project(xEnd, 0, netHeight + 2);
        ctx.beginPath(); ctx.moveTo(p2b.x, p2b.y); ctx.lineTo(p2t.x, p2t.y); ctx.stroke();
    }

    function drawRipples() {
        for (var i = ripples.length - 1; i >= 0; i--) {
            var r = ripples[i]; var p = project(r.x, r.y);
            ctx.strokeStyle = 'rgba(255,255,255,' + r.alpha + ')'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(p.x, p.y, r.s, r.s / 2, 0, 0, Math.PI * 2); ctx.stroke();
            r.s += 1.5; r.alpha -= 0.025;
            if (r.alpha <= 0) ripples.splice(i, 1);
        }
    }

    function drawTraces() {
        if (traces.length < 2 || isPaused) return;
        ctx.strokeStyle = 'rgba(239,255,0,0.3)'; ctx.lineWidth = 2;
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
        var pos = project(p.currentX, p.yPos, 15);
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        var labelY = side === 'top' ? -40 : 50;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(p.label, 0, labelY);
        ctx.fillStyle = 'white';
        ctx.fillText(p.label, 0, labelY);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.roundRect(-12, -18, 24, 36, 6); ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#333'; ctx.fillRect(-3, (side === 'top' ? -30 : 18), 6, 12);
        ctx.restore();
    }

    function update() {
        if (isPaused) return;
        if (ball.progress >= 1) return;
        ball.progress += ball.speed;
        var bounceThreshold = 0.75;

        if (ball.state === 'flying' && ball.progress >= bounceThreshold) {
            ball.state = 'rebounding';
            ripples.push({ x: ball.bounceX, y: ball.bounceY, s: 2, alpha: 1 });
            if (ball.phase === 'return') {
                targetHighlightAlpha = 0.6;
            }
        }

        if (ball.progress >= 1) {
            ball.progress = 1;
            if (ball.phase === 'return') {
                isPaused = true;
                setTimeout(function() {
                    paddles.top.side = (paddles.top.side === 'even') ? 'odd' : 'even';
                    paddles.top.targetX = (paddles.top.side === 'even') ? -45 : 45;
                    paddles.top.currentX = paddles.top.targetX;
                    ball.phase = 'serve';
                    ball.x = paddles.top.currentX;
                    ball.y = paddles.top.yPos;
                    isPaused = false;
                    planNextShot();
                }, 2000);
            } else {
                ball.phase = 'return';
                planNextShot();
            }
        }

        if (ball.state === 'flying') {
            var t = ball.progress / bounceThreshold;
            ball.x = ball.startX + (ball.bounceX - ball.startX) * t;
            ball.y = ball.startY + (ball.bounceY - ball.startY) * t;
            ball.z = 4 * ball.peakZ * t * (1 - t);
        } else {
            var t2 = (ball.progress - bounceThreshold) / (1 - bounceThreshold);
            ball.x = ball.bounceX + (ball.targetX - ball.bounceX) * t2;
            ball.y = ball.bounceY + (ball.targetY - ball.bounceY) * t2;
            ball.z = Math.sin(t2 * (Math.PI / 2)) * 15;
        }
        traces.push({ x: ball.x, y: ball.y, z: ball.z });
    }

    function drawBall() {
        if (isPaused) return;
        var shadowPos = project(ball.x, ball.y, 0);
        var ballPos = project(ball.x, ball.y, ball.z);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(shadowPos.x, shadowPos.y, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        var size = ball.radius + (ball.z * 0.04);
        var grad = ctx.createRadialGradient(ballPos.x - 2, ballPos.y - 2, 1, ballPos.x, ballPos.y, size);
        grad.addColorStop(0, '#ffffaa'); grad.addColorStop(1, ball.color);
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
    resetPlay();
    animate();
})();
