/*
        // URL de la imagen
        const imageUrl = 'https://i.postimg.cc/BQ4Dq6cj/logo.png';

        // Obtener el contenedor div por su ID
        const container = document.getElementById('imageContainer');

        // Crear un nuevo elemento de imagen
        const imgElement = document.createElement('img');

        // Establecer el atributo src con la URL de la imagen
        imgElement.src = imageUrl;

        // Añadir clases de Bootstrap para hacerla responsive y estilizarla
        imgElement.classList.add('img-fluid', 'rounded'); // img-fluid hace la imagen responsive, rounded añade bordes redondeados

        // Añadir un texto alternativo para accesibilidad
        imgElement.alt = 'Logo cargado desde el repositorio';

//VERIFICAR OBJETOS
        // Manejar error en caso de que la imagen no cargue
        imgElement.onerror = function() {
            container.innerHTML += '<p class="text-danger">No se pudo cargar la imagen.</p>';
        };

        // Añadir la imagen al contenedor div
        container.appendChild(imgElement);
*/


        // --- Estado de la Aplicación ---
        let currentProduct = {
            id: '1',
            name: 'Colcafe Clasico Stick 1.5gr',
            price: 1500,
            img: 'https://placehold.co/60x60/FFFFFF/000000?text=Colcafe',
            desc: 'COLCAFE CLASICO STICK x 1.5 GR. Disfruta del sabor clásico.',
            unit: 'unidad', // 'unidad', 'libra', 'onza', 'otro'
            quantity: 1
        };
        let cart = []; // Array para guardar los items del carrito {id, name, price, quantity, img}
        
        // --- Selectores de Elementos del DOM ---
        const categoryItems = document.querySelectorAll('.category-item');
        const categoryTitle = document.getElementById('category-title');
        const productItems = document.querySelectorAll('.product-item'); // Carrusel principal
        const productDescription = document.getElementById('product-description');
        const productPriceDisplay = document.getElementById('product-price');
        const totalItemPriceDisplay = document.getElementById('total-item-price');
        const quantityInput = document.getElementById('quantity');
        const decreaseQtyBtn = document.getElementById('decrease-qty');
        const increaseQtyBtn = document.getElementById('increase-qty');
        const unitButtons = document.querySelectorAll('.unit-button');
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartCountDisplay = document.getElementById('cart-count');
        const cartSubtotalDisplay = document.getElementById('cart-subtotal');
        const cartTotalDisplay = document.getElementById('cart-total');
        const emptyCartMsg = document.getElementById('empty-cart-msg');
        // No necesitamos el toggle de menú JS, Bootstrap lo maneja
               
        // --- Funciones ---

        // Actualiza la sección de detalle del producto
        function updateProductDetail(productData) {
            currentProduct = { ...currentProduct, ...productData, quantity: 1 }; // Resetea cantidad
            productDescription.textContent = currentProduct.desc;
            productPriceDisplay.textContent = formatCurrency(currentProduct.price);
            quantityInput.value = currentProduct.quantity;
            updateTotalItemPrice();

            // Marcar el producto seleccionado visualmente en el carrusel principal
            productItems.forEach(item => {
                item.classList.remove('selected');
                if (item.dataset.id === currentProduct.id) {
                    item.classList.add('selected');
                }
            });
             //   console.log("Producto actual:", currentProduct);
             // Podrías añadir lógica para actualizar el carrusel de presentaciones también
        }        

        // Actualiza el precio total del item actual
        function updateTotalItemPrice() {
            const total = currentProduct.price * currentProduct.quantity;
            totalItemPriceDisplay.textContent = formatCurrency(total);
        }

        // Formatea un número como moneda
        function formatCurrency(amount) {
            // return `$ ${amount.toLocaleString('es-CO')}`; // Formato colombiano con decimales
             return `$ ${Math.round(amount).toLocaleString('es-CO')}`; // Sin decimales
        }
        
        // Renderiza los items en el carrito
        function renderCart() {
            cartItemsContainer.innerHTML = ''; // Limpiar carrito
            let subtotal = 0;
            let totalItems = 0;

            if (cart.length === 0) {
                if (emptyCartMsg) emptyCartMsg.style.display = 'block';
            } else {
                if (emptyCartMsg) emptyCartMsg.style.display = 'none';
                cart.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    subtotal += itemTotal;
                    totalItems += item.quantity;

                    const cartItemDiv = document.createElement('div');
                    // Usando clases de Bootstrap para el item del carrito
                    cartItemDiv.classList.add('cart-item', 'd-flex', 'justify-content-between', 'align-items-center', 'mb-2', 'border-bottom', 'pb-2');
                    cartItemDiv.dataset.id = item.id;

                    cartItemDiv.innerHTML = `
                        <div class="d-flex align-items-center gap-2">
                            <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                            <div>
                                <p class="small fw-medium mb-0 text-truncate" style="max-width: 120px;">${item.name}</p>
                                <p class="small text-muted mb-0">Cant: ${item.quantity} x ${formatCurrency(item.price)}</p>
                            </div>
                        </div>
                        <div class="text-end">
                            <p class="small fw-semibold mb-1">${formatCurrency(itemTotal)}</p>
                            <button class="btn btn-sm btn-outline-danger p-0 px-1 remove-item-btn" data-id="${item.id}" style="line-height: 1;">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `;
                    cartItemsContainer.appendChild(cartItemDiv);
                });
            }
            
            // Actualizar totales del carrito
            cartCountDisplay.textContent = totalItems;
            cartSubtotalDisplay.textContent = formatCurrency(subtotal);
            // Por ahora, total es igual a subtotal
            cartTotalDisplay.textContent = formatCurrency(subtotal);

            // Añadir event listeners a los botones "Quitar"
            addRemoveButtonListeners();
        }
        
      // Añade un producto al carrito o actualiza su cantidad
        function addToCart() {
            const existingItemIndex = cart.findIndex(item => item.id === currentProduct.id);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += currentProduct.quantity;
            } else {
                cart.push({
                    id: currentProduct.id,
                    name: currentProduct.name,
                    price: currentProduct.price,
                    quantity: currentProduct.quantity,
                    img: currentProduct.img
                });
            }
            // console.log("Carrito actualizado:", cart);
            renderCart();
            // Opcional: Mostrar una pequeña notificación o feedback
        }
        
        // Elimina un item del carrito
        function removeFromCart(productId) {
            cart = cart.filter(item => item.id !== productId);
            // console.log("Item eliminado, Carrito:", cart);
            renderCart();
        }

         // Añade listeners a los botones de eliminar
        function addRemoveButtonListeners() {
            const removeButtons = document.querySelectorAll('.remove-item-btn');
            removeButtons.forEach(button => {
                // Remover listener anterior para evitar duplicados
                button.removeEventListener('click', handleRemoveItem);
                button.addEventListener('click', handleRemoveItem);
            });
        }
        
        // Handler para el click en "Quitar"
        function handleRemoveItem(event) {
             // Ir al botón padre para obtener el ID, ya que el click puede ser en el icono <i>
             const button = event.target.closest('.remove-item-btn');
             if (button) {
                 const productId = button.dataset.id;
                 removeFromCart(productId);
             }
        }
        
        // Seleccionar Categoría
        categoryItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Prevenir comportamiento de enlace
                categoryTitle.textContent = item.textContent;
                // Marcar categoría seleccionada visualmente
                 categoryItems.forEach(el => el.classList.remove('active'));
                 item.classList.add('active');
                /*
                // console.log(`Categoría seleccionada: ${item.dataset.category}`);
                // Simular cambio de productos (igual que antes)
                 if (item.dataset.category === 'lacteos') {
                    const firstProduct = document.querySelector('.product-item'); // Podría necesitar un selector más específico si hay varios carruseles
                    if(firstProduct) {
                         updateProductDetail({
                            id: '10', name: 'Leche Entera 1L', price: 3500, img: 'https://placehold.co/60x60/FFFFFF/000000?text=Leche', desc: 'Leche entera UHT Larga Vida.'
                         });
                    }
                 } else {
                      const firstProduct = document.querySelector('.product-item');
                       if(firstProduct) {
                            updateProductDetail({
                                id: '1', name: 'Colcafe Clasico Stick 1.5gr', price: 1500, img: 'https://placehold.co/60x60/FFFFFF/000000?text=Colcafe', desc: 'COLCAFE CLASICO STICK x 1.5 GR. Disfruta del sabor clásico.'
                            });
                       }
                 }
                 */
                 // En móvil, cerrar el menú desplegable después de seleccionar
                 const mobileMenu = document.getElementById('mobileMenu');
                 if (mobileMenu && mobileMenu.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(mobileMenu) || new bootstrap.Collapse(mobileMenu);
                    bsCollapse.hide();
                 }
            });
        });
       
        // Seleccionar Producto del Carrusel Principal
        productItems.forEach(item => {
            item.addEventListener('click', () => {            
                const productData = {
                    id: item.dataset.id,
                    name: item.dataset.name,
                    price: parseInt(item.dataset.price, 10),
                    img: item.dataset.img,
                    desc: item.dataset.desc
                };
                updateProductDetail(productData);
            });           
        });

        // Cambiar Cantidad
        decreaseQtyBtn.addEventListener('click', () => {
            let currentVal = parseInt(quantityInput.value, 10);
            if (currentVal > 1) {
                currentProduct.quantity = currentVal - 1;
                quantityInput.value = currentProduct.quantity;
                updateTotalItemPrice();
            }
        });

        increaseQtyBtn.addEventListener('click', () => {
             let currentVal = parseInt(quantityInput.value, 10);
            currentProduct.quantity = currentVal + 1;
            quantityInput.value = currentProduct.quantity;
            updateTotalItemPrice();
        });

        quantityInput.addEventListener('change', (e) => {
             const newQuantity = parseInt(e.target.value, 10);
             if (newQuantity >= 1) {
                 currentProduct.quantity = newQuantity;
             } else {
                 currentProduct.quantity = 1;
                 e.target.value = 1;
             }
             updateTotalItemPrice();
        });

        // Seleccionar Unidad de Compra
        unitButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentProduct.unit = button.dataset.unit;
                unitButtons.forEach(btn => btn.classList.remove('active')); // Usar 'active'
                button.classList.add('active');
                // console.log(`Unidad seleccionada: ${currentProduct.unit}`);
            });
        });

        // Añadir al Carrito
        addToCartBtn.addEventListener('click', addToCart);

        // --- Inicialización ---
        document.addEventListener('DOMContentLoaded', () => {
            // Cargar detalle del primer producto al inicio
            const firstProduct = document.querySelector('.product-item'); // Asegúrate que selecciona el correcto
            if (firstProduct) {
                 const initialProductData = {
                    id: firstProduct.dataset.id,
                    name: firstProduct.dataset.name,
                    price: parseInt(firstProduct.dataset.price, 10),
                    img: firstProduct.dataset.img,
                    desc: firstProduct.dataset.desc
                };
                updateProductDetail(initialProductData);
            } else {
                // console.warn("No se encontró el primer producto para inicializar.");
                // Podrías querer ocultar/deshabilitar la sección de compra si no hay producto
            }
            renderCart(); // Renderizar el carrito inicial (vacío)

            // No es necesario manejar la visibilidad inicial de las columnas con JS,
            // las clases `collapse d-md-block` de Bootstrap se encargan de eso.
        });        
                                   


 
        
        
        

      
        
        
