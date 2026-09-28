(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------
     Mobile nav
  ----------------------------------------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("navBurger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav__links a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* -----------------------------------------
     Reveal on scroll
  ----------------------------------------- */
  var revealTargets = document.querySelectorAll(".section__body, .stat-strip, .compare, .scoper, .steps, .case-graphs, .code-block, .anatomy-panel, .formula, .sector-grid");
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* -----------------------------------------
     Hero graph canvas
     Two coupled node clusters (grid / response
     network) drifting and connecting — the same
     shape as the product.
  ----------------------------------------- */
  var canvas = document.getElementById("graphCanvas");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var hero = document.getElementById("hero");
    var W, H, DPR;
    var nodes = [];
    var mouse = { x: null, y: null };

    var ACCENT = "110, 240, 194";
    var ACCENT2 = "167, 139, 250";

    function resize() {
      var rect = hero.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seedNodes();
    }

    function seedNodes() {
      var count = W < 700 ? 40 : 78;
      nodes = [];
      for (var i = 0; i < count; i++) {
        var isHub = i % 9 === 0;
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          pullX: 0,
          pullY: 0,
          pullVX: 0,
          pullVY: 0,
          r: isHub ? Math.random() * 1.6 + 3.2 : Math.random() * 1.8 + 1.3,
          hue: Math.random() < 0.68 ? ACCENT : ACCENT2,
          phase: Math.random() * Math.PI * 2,
          isHub: isHub
        });
      }
    }

    // Gravity well: nodes accelerate toward the cursor within PULL_RADIUS,
    // eased by a spring so they settle back to their drift path on release.
    var PULL_STRENGTH = 0.055;
    var PULL_FRICTION = 0.9;
    var PULL_MAX = 70;

    function step(t) {
      ctx.clearRect(0, 0, W, H);
      var linkDist = W < 700 ? 130 : 175;
      var pullRadius = W < 700 ? 170 : 260;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;

        var px = n.x + n.pullX, py = n.y + n.pullY;

        if (mouse.x !== null) {
          var dx = mouse.x - px, dy = mouse.y - py;
          var d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          if (d < pullRadius) {
            var falloff = 1 - d / pullRadius;
            n.pullVX += (dx / d) * falloff * PULL_STRENGTH * (n.isHub ? 1.4 : 1);
            n.pullVY += (dy / d) * falloff * PULL_STRENGTH * (n.isHub ? 1.4 : 1);
          }
        }

        n.pullVX *= PULL_FRICTION;
        n.pullVY *= PULL_FRICTION;
        n.pullX += n.pullVX;
        n.pullY += n.pullVY;

        var pullMag = Math.sqrt(n.pullX * n.pullX + n.pullY * n.pullY);
        if (pullMag > PULL_MAX) {
          var scale = PULL_MAX / pullMag;
          n.pullX *= scale;
          n.pullY *= scale;
        }

        n.px = n.x + n.pullX;
        n.py = n.y + n.pullY;
      }

      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var na = nodes[a], nb = nodes[b];
          var ddx = na.px - nb.px, ddy = na.py - nb.py;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < linkDist) {
            var linkHue = na.isHub || nb.isHub ? ACCENT2 : ACCENT;
            var alpha = (1 - dist / linkDist) * 0.55;
            ctx.strokeStyle = "rgba(" + linkHue + ", " + alpha + ")";
            ctx.lineWidth = na.isHub || nb.isHub ? 1.3 : 1;
            ctx.beginPath();
            ctx.moveTo(na.px, na.py);
            ctx.lineTo(nb.px, nb.py);
            ctx.stroke();
          }
        }
      }

      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        var pulse = node.isHub
          ? 0.82 + Math.sin(t * 0.0012 + node.phase) * 0.18
          : 0.72 + Math.sin(t * 0.0012 + node.phase) * 0.26;
        ctx.save();
        ctx.shadowBlur = node.isHub ? 14 : 6;
        ctx.shadowColor = "rgba(" + node.hue + ", 0.9)";
        ctx.beginPath();
        ctx.arc(node.px, node.py, node.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + node.hue + ", " + pulse + ")";
        ctx.fill();
        ctx.restore();
      }

      if (!prefersReducedMotion) {
        requestAnimationFrame(step);
      }
    }

    window.addEventListener("resize", resize);
    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener("mouseleave", function () {
      mouse.x = null;
      mouse.y = null;
    });

    resize();
    requestAnimationFrame(step);
  }

  /* -----------------------------------------
     Scoping assistant (scripted preview)
  ----------------------------------------- */
  var log = document.getElementById("scoperLog");
  var form = document.getElementById("scoperForm");
  var input = document.getElementById("scoperInput");
  var specOutput = document.getElementById("specOutput");
  var specCta = document.getElementById("specCta");

  if (form && log) {
    var questions = [
      { key: "subject", text: "First — what are you trying to schedule or route? For example: power feeder groups, ambulances, a delivery fleet, maintenance crews." },
      { key: "constraint", text: "Got it. What's the one constraint you can never violate?" },
      { key: "objective", text: "Last one — what matters most when you optimize this: cost, time, fairness, or risk?" }
    ];
    var answers = {};
    var stepIndex = 0;

    function addMessage(text, who) {
      var div = document.createElement("div");
      div.className = "msg msg--" + who;
      div.textContent = text;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }

    function askCurrent() {
      if (stepIndex < questions.length) {
        addMessage(questions[stepIndex].text, "bot");
      } else {
        finish();
      }
    }

    function finish() {
      addMessage("Here's the shape of your problem — a consultant will tighten this into a solvable QUBO.", "bot");
      renderSpec();
      specCta.hidden = false;
    }

    function renderSpec() {
      specOutput.innerHTML =
        '<dl>' +
        '<dt>Nodes</dt><dd>Each ' + escapeHtml(answers.subject || "unit") + ' the schedule has to assign or route.</dd>' +
        '<dt>Edges</dt><dd>Pairs of nodes that conflict, share infrastructure, or depend on one another — shaped by "' + escapeHtml(answers.constraint || "your constraint") + '".</dd>' +
        '<dt>Objective</dt><dd>Minimize a cost function weighted toward ' + escapeHtml(answers.objective || "your priority") + '.</dd>' +
        '<dt>Hard constraint</dt><dd>"' + escapeHtml(answers.constraint || "—") + '" — encoded as an infinite-penalty term, never a soft preference.</dd>' +
        '</dl>';
    }

    function escapeHtml(str) {
      var d = document.createElement("div");
      d.textContent = str;
      return d.innerHTML;
    }

    addMessage("I'll ask three quick questions to sketch your graph problem.", "bot");
    askCurrent();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = input.value.trim();
      if (!val || stepIndex >= questions.length) return;

      addMessage(val, "user");
      answers[questions[stepIndex].key] = val;
      stepIndex++;
      input.value = "";

      setTimeout(askCurrent, 260);
    });
  }

  /* -----------------------------------------
     Contact form (no backend yet — client-side
     acknowledgement only)
  ----------------------------------------- */
  var contactForm = document.getElementById("contactForm");
  var formStatus = document.getElementById("formStatus");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      formStatus.textContent = "Received — a consultant will reply within one business day.";
      contactForm.reset();
    });
  }

  /* -----------------------------------------
     Copy email
  ----------------------------------------- */
  var emailCopy = document.getElementById("emailCopy");
  var emailHint = document.getElementById("emailHint");
  if (emailCopy) {
    emailCopy.addEventListener("click", function () {
      var text = document.getElementById("emailText").textContent;
      function done() {
        emailHint.textContent = "copied";
        setTimeout(function () { emailHint.textContent = "copy"; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
  }

  function fallbackCopy(text, cb) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (err) { /* no-op */ }
    document.body.removeChild(ta);
    cb();
  }
})();
