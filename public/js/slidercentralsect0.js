
       const productSection = document.getElementById('product-section');
       const expandIcon = document.getElementById('expand-icon');
       const cartIcon = document.querySelector('.cart-icon');
       
       // const expandIcon = document.getElementById('expand-icon');
        //const idbtnpagar_ = document.getElementById('idbtnpagar');
        //const body = document.body;
        
        expandIcon.addEventListener('click', () => {
            if (productSection.classList.contains('col-md-6')) {
                productSection.classList.remove('col-md-6');
                productSection.classList.add('col-md-10');
                cartIcon.style.display = 'inline-block'; // Mostrar carrito al expandir                                                              
            } else {
                productSection.classList.remove('col-md-10');
                productSection.classList.add('col-md-6');
                cartIcon.style.display = 'none'; // Ocultar carrito al contraer
                expandIcon.style.visoble = 'false'; // Mostrar flecha al contraer                               
            }
            
            
        });
        
        cartIcon.addEventListener('click', () => {
            productSection.classList.remove('col-md-10'); // Contraer la sección
            productSection.classList.add('col-md-6');
            cartIcon.style.display = 'none'; // Ocultar el carrito
            expandIcon.style.display = 'inline-block'; // Mostrar la flecha
        });
              
     
        

        