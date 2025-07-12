const burgerMenu = document.getElementById('burgerMenu');
const navMenu = document.getElementById('navMenu');
const header = document.getElementById('header');

if (burgerMenu && navMenu) {
    burgerMenu.addEventListener('click', () => {
        burgerMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (burgerMenu && navMenu) {
            burgerMenu.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
});

if (header) {
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 0);
    });
}

document.addEventListener('click', (e) => {
    if (header && !header.contains(e.target) && burgerMenu && navMenu) {
        burgerMenu.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath || 
            (currentPath === '/' && link.getAttribute('href') === '/') ||
            (currentPath.includes(link.getAttribute('href')) && link.getAttribute('href') !== '/')) {
            link.classList.add('active');
        }
    });

    const db = firebase.firestore();
    const productsGrid = document.getElementById('productsGrid') || document.getElementById('productsGrid-tags');
    
    if (!productsGrid) {
        console.log('Products grid element not found');
        return;
    }
    
    const path = window.location.pathname.toLowerCase();
    const filename = path.endsWith('/') ? 'index' : path.split('/').pop().replace('.html', '');
    
    console.log('Current filename:', filename);
    
    let query = db.collection("products");
    
    if (filename === 'index') {
        console.log('Querying for MAIN category products'); 
        query = query.where("mainCategory", "==", "MAIN");
    }
    else {
        let mainCategory = '';
        let subCategory = null;
        
        if (filename.startsWith('mens-')) {
            mainCategory = 'MENS';
            const sub = filename.split('-')[1];
            if (sub === 'clothes') subCategory = 'CLOTHES';
            else if (sub === 'shoes') subCategory = 'SHOES';
            else if (sub === 'fragrance') subCategory = 'FRAGRANCE';
        }
        else if (filename.startsWith('women-')) {
            mainCategory = 'WOMEN';
            const sub = filename.split('-')[1];
            if (sub === 'clothes') subCategory = 'CLOTHES';
            else if (sub === 'shoes') subCategory = 'SHOES';
            else if (sub === 'fragrance') subCategory = 'FRAGRANCE';
        }
        else if (filename === 'kids') mainCategory = 'KIDS';
        else if (filename === 'tech') mainCategory = 'TECH';
        else if (filename.includes('jewelry') || filename.includes('accessories')) {
            mainCategory = 'JEWELRY & ACCESSORIES';
        }
        else if (filename === 'misc') mainCategory = 'MISC';
        
        if (mainCategory) {
            query = query.where("mainCategory", "==", mainCategory);
            
            if (subCategory !== null) {
                query = query.where("subCategory", "==", subCategory);
            }
        } else {
            productsGrid.innerHTML = '<p>Category not found</p>';
            return;
        }
    }

    productsGrid.innerHTML = '<div>Loading products...</div>';
    
    console.log('Executing Firestore query...'); 
    
    query.get()
        .then((querySnapshot) => {
            console.log('Query completed. Documents found:', querySnapshot.size); 
            
            productsGrid.innerHTML = '';
            
            if (querySnapshot.empty) {
                console.log('No products found in query result');
                productsGrid.innerHTML = '<div><p>No products found</p><a href="/" class="link-button">Browse all</a></div>';
                return;
            }
            
            const products = [];
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                product.id = doc.id; 
                products.push(product);
            });
            
            products.sort((a, b) => {
                const aDate = a.created_at ? a.created_at.toMillis() : 0;
                const bDate = b.created_at ? b.created_at.toMillis() : 0;
                return aDate - bDate;
            });
            
            console.log('Products sorted by created date (oldest first)');
            
            const fragment = document.createDocumentFragment();
            
            products.forEach((product) => {
                console.log('Processing product:', product.name, product);
                
                const productDiv = document.createElement('div');
                productDiv.className = 'product-div';
                
                let imageHTML = '<div class="image-placeholder">No Image</div>';
                if (product.image?.data) {
                    imageHTML = `<img src="data:${product.image.contentType || 'image/jpeg'};base64,${product.image.data}" alt="${product.name || ''}" loading="lazy">`;
                }
                
                productDiv.innerHTML = `
                    ${imageHTML}
                    <div class="product-name">${product.name || 'Unnamed Product'}</div>
                    <div class="product-price">$${parseFloat(product.price || 0).toFixed(2)}</div>
                    <a href="${product.link || '#'}" class="link-button" target="_blank" rel="noopener">LINK</a>
                `;
                
                fragment.appendChild(productDiv);
            });
            
            productsGrid.appendChild(fragment);
            console.log('Products displayed successfully');
        })
        .catch((error) => {
            console.error("Firestore Error:", error);
            productsGrid.innerHTML = '<div><p>Error loading products</p><button class="retry-button">Retry</button></div>';
            
            const retryButton = productsGrid.querySelector('.retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    location.reload();
                });
            }
        });
});