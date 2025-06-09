        // Burger menu toggle
        const burgerMenu = document.getElementById('burgerMenu');
        const navMenu = document.getElementById('navMenu');
        const header = document.getElementById('header');

        burgerMenu.addEventListener('click', () => {
            burgerMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on nav links (mobile)
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                burgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Add shadow on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 0) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Close menu when clicking outside (mobile)
        document.addEventListener('click', (e) => {
            if (!header.contains(e.target)) {
                burgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });

          $(window).scroll(function() {
            $(".product-div").css("opacity", 1 - $(window).scrollTop() / 250);
            if ($(window).scrollTop() > 100) {
                $(".product-div").fadeIn();
            } else {
                $(".product-div").fadeOut();
            }
        }
        );