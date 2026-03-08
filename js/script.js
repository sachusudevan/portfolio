document.addEventListener("DOMContentLoaded", () => {
    
    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                AOS.init({
                    duration: 1000,
                    once: true,
                    offset: 100,
                });
            }, 500);
        }, 800);
    });

    // --- Particle Background System ---
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedX = Math.random() * 0.3 - 0.15;
            this.speedY = Math.random() * 0.3 - 0.15;
            this.color = Math.random() > 0.7 ? '#00ffa3' : 'rgba(255, 255, 255, 0.2)';
            this.opacity = Math.random() * 0.4 + 0.05;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class TechNode {
        constructor() { this.init(); }
        init() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.opacity = 0;
            this.maxOpacity = Math.random() * 0.4 + 0.1;
            this.life = 0;
            this.maxLife = Math.random() * 400 + 200;
            this.pinging = false;
        }
        update() {
            this.life++;
            if (this.life < 100) this.opacity += 0.005;
            else if (this.life > this.maxLife - 100) this.opacity -= 0.005;

            if (Math.random() > 0.99 && !this.pinging) {
                this.pinging = true;
                this.pingRadius = 0;
            }
            if (this.pinging) {
                this.pingRadius += 1;
                if (this.pingRadius > 30) this.pinging = false;
            }

            if (this.life >= this.maxLife) this.init();
        }
        draw() {
            ctx.fillStyle = '#00ffa3';
            ctx.globalAlpha = Math.max(0, this.opacity);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            if (this.pinging) {
                ctx.strokeStyle = '#00ffa3';
                ctx.lineWidth = 1;
                ctx.globalAlpha = (1 - (this.pingRadius / 30)) * 0.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.pingRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    class ScanLine {
        constructor() { this.init(); }
        init() {
            this.vertical = Math.random() > 0.5;
            if (this.vertical) {
                this.x = Math.random() * canvas.width;
                this.y = -200;
                this.speed = Math.random() * 3 + 2;
            } else {
                this.x = -200;
                this.y = Math.random() * canvas.height;
                this.speed = Math.random() * 3 + 2;
            }
            this.length = Math.random() * 300 + 200;
            this.color = '#00ffa3';
        }
        update() {
            if (this.vertical) this.y += this.speed;
            else this.x += this.speed;

            if (this.x > canvas.width + 200 || this.y > canvas.height + 200) this.init();
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = 0.2;
            const gradient = this.vertical 
                ? ctx.createLinearGradient(0, this.y - this.length, 0, this.y)
                : ctx.createLinearGradient(this.x - this.length, 0, this.x, 0);
            
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(1, this.color);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (this.vertical) {
                ctx.moveTo(this.x, this.y - this.length);
                ctx.lineTo(this.x, this.y);
            } else {
                ctx.moveTo(this.x - this.length, this.y);
                ctx.lineTo(this.x, this.y);
            }
            ctx.stroke();

            // Leading pulse head
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    let techNodes = [];
    let scanLines = [];
    function initParticles() {
        particles = [];
        techNodes = [];
        scanLines = [];
        const numberOfParticles = (canvas.width * canvas.height) / 40000;
        for (let i = 0; i < numberOfParticles; i++) {
            particles.push(new Particle());
        }
        for (let i = 0; i < 40; i++) techNodes.push(new TechNode());
        for (let i = 0; i < 8; i++) scanLines.push(new ScanLine());
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        techNodes.forEach(n => { n.update(); n.draw(); });
        scanLines.forEach(l => { l.update(); l.draw(); });
        requestAnimationFrame(animateParticles);
    }
    
    initParticles();
    animateParticles();

    // --- Magnetic Hover Effect ---
    const magneticElements = document.querySelectorAll('.social-icon, .btn, .logo, .thumb');
    
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)';
        });
    });

    // --- Custom Cursor Enhanced ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    if (globalThis.matchMedia("(pointer: fine)").matches) {
        globalThis.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;
            
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 400, fill: "forwards" });
        });

        const interactiveElements = document.querySelectorAll('a, button, input, textarea, .project-card, .timeline-item, .thumb');
        
        interactiveElements.forEach((el) => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '70px';
                cursorOutline.style.height = '70px';
                cursorOutline.style.backgroundColor = 'rgba(0, 255, 163, 0.05)';
                cursorOutline.style.borderColor = '#00ffa3';
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '40px';
                cursorOutline.style.height = '40px';
                cursorOutline.style.backgroundColor = 'transparent';
                cursorOutline.style.borderColor = '#00ffa3';
            });
        });
    }

    // --- Typing Animation ---
    const typingText = document.querySelector('.typing-text');
    const words = ["Technical Lead", "Software Engineer", "Solutions Architect", "Healthcare Data Expert"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typingText.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 40;
        } else {
            typingText.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 120;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2500;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }
    
    setTimeout(type, 1500);

    // --- Profile Gallery ---
    const galleryThumbs = document.querySelectorAll('.thumb');
    const mainGalleryImg = document.querySelector('.active-img');
    let currentGalleryIndex = 1;
    let galleryInterval;

    function updateGallery(index) {
        galleryThumbs.forEach(t => t.classList.remove('active'));
        galleryThumbs[index].classList.add('active');
        
        const newSrc = galleryThumbs[index].dataset.src;
        mainGalleryImg.style.filter = 'blur(10px) brightness(0.5)';
        mainGalleryImg.style.opacity = '0';
        
        setTimeout(() => {
            mainGalleryImg.src = newSrc;
            mainGalleryImg.style.filter = 'blur(0px) brightness(1)';
            mainGalleryImg.style.opacity = '1';
        }, 300);
        
        currentGalleryIndex = index;
    }

    galleryThumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            updateGallery(index);
            // Reset interval on manual click
            startGalleryTimer();
        });
    });

    function startGalleryTimer() {
        clearInterval(galleryInterval);
        galleryInterval = setInterval(() => {
            let nextIndex = (currentGalleryIndex + 1) % galleryThumbs.length;
            updateGallery(nextIndex);
        }, 5000);
    }

    // Start auto-rotation
    if (galleryThumbs.length > 0) {
        startGalleryTimer();
    }

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // --- Active Link Highlight on Scroll ---
    const sections = document.querySelectorAll('section, header');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // --- Project Filtering ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filterValue = btn.dataset.filter;
            
            projectCards.forEach(card => {
                if (filterValue === 'all' || card.classList.contains(filterValue)) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // --- Update Footer Year ---
    document.getElementById('year').textContent = new Date().getFullYear();


    // --- Smooth Scrolling for internal links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

