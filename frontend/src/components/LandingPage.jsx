import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const rootEl = rootRef.current;
    const canvas = canvasRef.current;

    if (!rootEl || !canvas) {
      return undefined;
    }

    let rafId = 0;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      56,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 28);

    const ambient = new THREE.AmbientLight(0x4b5cff, 0.7);
    scene.add(ambient);

    const pointA = new THREE.PointLight(0x55f5ff, 1.4, 100);
    pointA.position.set(11, 8, 18);
    scene.add(pointA);

    const pointB = new THREE.PointLight(0x9b6dff, 0.9, 100);
    pointB.position.set(-9, -6, 14);
    scene.add(pointB);

    const particleCount = 1500;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      const radius = 10 + Math.random() * 24;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = (Math.random() - 0.5) * 28;
      seeds[i] = Math.random() * Math.PI * 2;
    }

    const basePositions = positions.slice();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x73e9ff,
      size: 0.13,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(points);

    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    const orbConfigs = [
      {
        geo: new THREE.IcosahedronGeometry(3, 1),
        color: 0x56dbff,
        emissive: 0x2e8dff,
        pos: [10, 2, -8],
      },
      {
        geo: new THREE.TorusGeometry(2.2, 0.62, 24, 120),
        color: 0x9f80ff,
        emissive: 0x7f52ff,
        pos: [-9, -2, -5],
      },
      {
        geo: new THREE.OctahedronGeometry(2.6, 1),
        color: 0x6ffff3,
        emissive: 0x14b7ff,
        pos: [0, -6, -10],
      },
    ];

    const orbs = orbConfigs.map((config) => {
      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.emissive,
        emissiveIntensity: 0.45,
        metalness: 0.2,
        roughness: 0.25,
        transparent: true,
        opacity: 0.86,
      });
      const mesh = new THREE.Mesh(config.geo, material);
      mesh.position.set(config.pos[0], config.pos[1], config.pos[2]);
      orbGroup.add(mesh);
      return {
        mesh,
        baseY: config.pos[1],
        phase: Math.random() * Math.PI * 2,
      };
    });

    const targetMouse = { x: 0, y: 0 };
    const smoothMouse = { x: 0, y: 0 };

    const handlePointerMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      targetMouse.x = x;
      targetMouse.y = y;
    };

    window.addEventListener("pointermove", handlePointerMove);

    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.06;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.06;

      const attr = particleGeometry.getAttribute("position");
      for (let i = 0; i < particleCount; i += 1) {
        const i3 = i * 3;
        const seed = seeds[i];
        const noiseA = Math.sin(elapsed * 0.5 + seed) * 0.32;
        const noiseB = Math.cos(elapsed * 0.38 + seed * 1.7) * 0.28;
        attr.array[i3] = basePositions[i3] + noiseA;
        attr.array[i3 + 1] = basePositions[i3 + 1] + noiseB;
      }
      attr.needsUpdate = true;

      points.rotation.y += 0.0007;
      points.rotation.x = smoothMouse.y * 0.08;
      points.position.x = smoothMouse.x * 1.3;
      points.position.y = -smoothMouse.y * 1.3;

      orbGroup.rotation.x +=
        (smoothMouse.y * 0.22 - orbGroup.rotation.x) * 0.04;
      orbGroup.rotation.y +=
        (smoothMouse.x * 0.22 - orbGroup.rotation.y) * 0.04;

      orbs.forEach(({ mesh, baseY, phase }, index) => {
        mesh.rotation.x += 0.004 + index * 0.001;
        mesh.rotation.y += 0.006 + index * 0.001;
        mesh.position.y = baseY + Math.sin(elapsed * 0.55 + phase) * 1.45;
        mesh.position.x +=
          (smoothMouse.x * (1.4 + index * 0.5) - mesh.position.x * 0.03) * 0.02;
      });

      camera.position.x += (smoothMouse.x * 1.4 - camera.position.x) * 0.03;
      camera.position.y += (-smoothMouse.y * 1.2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    };

    window.addEventListener("resize", handleResize);

    const hoverCleanups = [];

    if (!window.matchMedia("(pointer: coarse)").matches) {
      const tiltCards = Array.from(rootEl.querySelectorAll("[data-tilt-card]"));
      tiltCards.forEach((card) => {
        const onMove = (event) => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          const rotateY = (px - 0.5) * 12;
          const rotateX = (0.5 - py) * 10;
          gsap.to(card, {
            rotateX,
            rotateY,
            scale: 1.02,
            duration: 0.25,
            ease: "power2.out",
            transformPerspective: 900,
            transformOrigin: "center",
          });
        };

        const onLeave = () => {
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
          });
        };

        card.addEventListener("pointermove", onMove);
        card.addEventListener("pointerleave", onLeave);

        hoverCleanups.push(() => {
          card.removeEventListener("pointermove", onMove);
          card.removeEventListener("pointerleave", onLeave);
        });
      });

      const magneticButtons = Array.from(
        rootEl.querySelectorAll("[data-magnetic]"),
      );
      magneticButtons.forEach((button) => {
        const onMove = (event) => {
          const rect = button.getBoundingClientRect();
          const dx = event.clientX - (rect.left + rect.width / 2);
          const dy = event.clientY - (rect.top + rect.height / 2);

          gsap.to(button, {
            x: dx * 0.18,
            y: dy * 0.18,
            duration: 0.25,
            ease: "power3.out",
          });
        };

        const onLeave = () => {
          gsap.to(button, {
            x: 0,
            y: 0,
            duration: 0.4,
            ease: "elastic.out(1, 0.45)",
          });
        };

        button.addEventListener("pointermove", onMove);
        button.addEventListener("pointerleave", onLeave);

        hoverCleanups.push(() => {
          button.removeEventListener("pointermove", onMove);
          button.removeEventListener("pointerleave", onLeave);
        });
      });
    }

    const gsapCtx = gsap.context(() => {
      gsap.fromTo(
        ".landing-hero-title, .landing-hero-subtitle, .landing-hero-cta",
        { autoAlpha: 0, y: 40, scale: 0.97 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          ease: "power3.out",
          duration: 1.1,
          stagger: 0.12,
        },
      );

      gsap.fromTo(
        ".hero-floating-card",
        { autoAlpha: 0, y: 55, scale: 0.9 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          stagger: 0.16,
          duration: 1.2,
          ease: "power3.out",
          delay: 0.2,
        },
      );

      gsap.utils.toArray(".landing-section").forEach((section) => {
        const elements = section.querySelectorAll(
          ".section-intro, .section-card",
        );

        gsap.fromTo(
          elements,
          { autoAlpha: 0, y: 56, scale: 0.96 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 1.1,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: section,
              start: "top 75%",
              end: "bottom 45%",
              scrub: 0.8,
            },
          },
        );
      });

      gsap.to(".landing-hero-content", {
        yPercent: -14,
        ease: "none",
        scrollTrigger: {
          trigger: ".landing-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.4,
        },
      });

      gsap.to(".landing-webgl-shell", {
        opacity: 0.7,
        ease: "none",
        scrollTrigger: {
          trigger: ".landing-page",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });
    }, rootEl);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      hoverCleanups.forEach((cleanup) => cleanup());
      gsapCtx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      orbs.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      scene.clear();
    };
  }, []);

  return (
    <div className="landing-page" ref={rootRef}>
      <div className="landing-webgl-shell" aria-hidden="true">
        <canvas className="landing-canvas" ref={canvasRef} />
      </div>

      <header className="landing-nav">
        <div className="brand-mark">EMS</div>
        <nav className="landing-nav-links" />
        <Link className="landing-btn ghost" to="/login" data-magnetic>
          Login
        </Link>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <p className="hero-kicker">Future-ready workplace intelligence</p>
            <h1 className="landing-hero-title">Employee Management System</h1>
            <p className="landing-hero-subtitle">
              Smart Payroll, Attendance &amp; Analytics
            </p>
            <div className="landing-hero-cta">
              <Link className="landing-btn" to="/login" data-magnetic>
                Launch EMS
              </Link>
            </div>
          </div>

          <div className="hero-floating-grid" aria-hidden="true">
            <article className="hero-floating-card" data-tilt-card>
              <span>Employee Hub</span>
              <strong>245 Active Profiles</strong>
              <small>Automated role-based access</small>
            </article>
            <article className="hero-floating-card" data-tilt-card>
              <span>Payroll Engine</span>
              <strong>98.6% Faster Runs</strong>
              <small>Precision calculations, no delays</small>
            </article>
            <article className="hero-floating-card" data-tilt-card>
              <span>Attendance Pulse</span>
              <strong>Real-time Live Sync</strong>
              <small>Smart leave and work tracking</small>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
