document.addEventListener('DOMContentLoaded', () => {
    // Control de Pestañas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetContent = document.getElementById(btn.dataset.tab);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // Elementos del DOM
    const formWork = document.getElementById('work-form');
    const formTask = document.getElementById('task-form');
    const fechaInput = document.getElementById('fecha');
    const taskFechaInput = document.getElementById('task-fecha');
    const tarifaInput = document.getElementById('tarifa');
    const registrosTabla = document.getElementById('registros-tabla');
    const listaTareas = document.getElementById('lista-tareas');
    const totalHorasEl = document.getElementById('total-horas');
    const totalDineroEl = document.getElementById('total-dinero');
    const taskTipoPago = document.getElementById('task-tipo-pago');
    const groupHorasEst = document.getElementById('group-horas-est');
    const labelPrecioTarea = document.getElementById('label-precio-tarea');

    // Elementos de Búsqueda y Ordenación
    const ordenSelect = document.getElementById('orden-historial');
    const buscarClienteInput = document.getElementById('buscar-cliente');

    // Escuchadores de eventos para Búsqueda y Orden
    if (ordenSelect) {
        ordenSelect.addEventListener('change', actualizarInterfaz);
    }
    if (buscarClienteInput) {
        buscarClienteInput.addEventListener('input', actualizarInterfaz);
    }

    // Fecha predeterminada (Hoy local YYYY-MM-DD)
    const hoyObj = new Date();
    const hoyStr = hoyObj.getFullYear() + '-' + 
                   String(hoyObj.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(hoyObj.getDate()).padStart(2, '0');

    if (fechaInput) fechaInput.value = hoyStr;
    if (taskFechaInput) taskFechaInput.value = hoyStr;

    // Cargar datos guardados
    let registros = JSON.parse(localStorage.getItem('registros_trabajo')) || [];
    let tareas = JSON.parse(localStorage.getItem('tareas_programadas')) || [];
    
    const ultimaTarifa = localStorage.getItem('ultima_tarifa');
    if (ultimaTarifa) {
        if (tarifaInput) tarifaInput.value = ultimaTarifa;
        const taskPrecioInput = document.getElementById('task-precio');
        if (taskPrecioInput) taskPrecioInput.value = ultimaTarifa;
    }

    // Cambiar dinámicamente inputs de tarea según tipo de pago
    if (taskTipoPago) {
        taskTipoPago.addEventListener('change', () => {
            if (taskTipoPago.value === 'fijo') {
                if (groupHorasEst) groupHorasEst.style.display = 'none';
                if (labelPrecioTarea) labelPrecioTarea.textContent = 'Precio Total Fijo (€)';
            } else {
                if (groupHorasEst) groupHorasEst.style.display = 'flex';
                if (labelPrecioTarea) labelPrecioTarea.textContent = 'Precio por Hora (€)';
            }
        });
    }

    actualizarInterfaz();

    // Guardar Jornada Trabajada
    if (formWork) {
        formWork.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fecha = document.getElementById('fecha').value;
            const horaInicio = document.getElementById('hora-inicio').value;
            const horaFin = document.getElementById('hora-fin').value;
            const descansoMin = parseInt(document.getElementById('descanso').value) || 0;
            const tarifa = parseFloat(document.getElementById('tarifa').value) || 0;
            
            const clienteEl = document.getElementById('cliente');
            const servicioEl = document.getElementById('servicio');
            const clienteVal = clienteEl ? clienteEl.value.trim() : 'Sin cliente';
            const servicioVal = servicioEl ? servicioEl.value.trim() : 'Servicio General';

            const [hInicio, mInicio] = horaInicio.split(':').map(Number);
            const [hFin, mFin] = horaFin.split(':').map(Number);
            let minTotales = (hFin * 60 + mFin) - (hInicio * 60 + mInicio) - descansoMin;

            if (minTotales <= 0) {
                alert("La hora de fin debe ser posterior a la de inicio.");
                return;
            }

            const horas = minTotales / 60;
            const ganado = horas * tarifa;

            localStorage.setItem('ultima_tarifa', tarifa);

            if (fecha > hoyStr) {
                const nuevaTarea = {
                    id: Date.now(),
                    nombre: servicioVal,
                    cliente: clienteVal,
                    fecha,
                    tipoPago: 'por_hora',
                    horasEstimadas: horas,
                    precio: tarifa,
                    totalCalculado: ganado,
                    completada: false
                };

                tareas.unshift(nuevaTarea);
            } else {
                registros.unshift({
                    id: Date.now(),
                    fecha,
                    cliente: clienteVal,
                    servicio: servicioVal,
                    horas,
                    ganado
                });
            }

            guardarYActualizar();
            
            document.getElementById('hora-inicio').value = '';
            document.getElementById('hora-fin').value = '';
            document.getElementById('descanso').value = '0';
            if (clienteEl) clienteEl.value = '';
            if (servicioEl) servicioEl.value = '';
        });
    }

    // Guardar Nueva Tarea Programada (Formulario Secundario)
    if (formTask) {
        formTask.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('task-nombre').value;
            const fecha = document.getElementById('task-fecha').value;
            const tipoPago = document.getElementById('task-tipo-pago').value;
            const precio = parseFloat(document.getElementById('task-precio').value) || 0;

            let horasEstimadas = 0;
            let totalCalculado = 0;

            if (tipoPago === 'por_hora') {
                horasEstimadas = parseFloat(document.getElementById('task-horas').value) || 0;
                totalCalculado = horasEstimadas * precio;
            } else {
                totalCalculado = precio;
                horasEstimadas = 0;
            }

            const nuevaTarea = {
                id: Date.now(),
                nombre,
                cliente: 'General',
                fecha,
                tipoPago,
                horasEstimadas,
                precio,
                totalCalculado,
                completada: false
            };

            tareas.unshift(nuevaTarea);
            guardarYActualizar();
            document.getElementById('task-nombre').value = '';
        });
    }

    function guardarYActualizar() {
        localStorage.setItem('registros_trabajo', JSON.stringify(registros));
        localStorage.setItem('tareas_programadas', JSON.stringify(tareas));
        actualizarInterfaz();
    }

    function actualizarInterfaz() {
        // Renderizar Tabla de Jornadas Realizadas
        if (registrosTabla) {
            registrosTabla.innerHTML = '';
            let totalHoras = 0;
            let totalDinero = 0;

            const orden = ordenSelect ? ordenSelect.value : 'reciente';
            const textoBusqueda = buscarClienteInput ? buscarClienteInput.value.toLowerCase().trim() : '';

            // Filtrar registros por nombre de cliente
            let registrosFiltrados = registros.filter(reg => {
                const cliente = (reg.cliente || '').toLowerCase();
                return cliente.includes(textoBusqueda);
            });

            // Ordenar el historial
            registrosFiltrados.sort((a, b) => {
                if (orden === 'antiguo') {
                    return a.fecha.localeCompare(b.fecha) || a.id - b.id;
                } else {
                    return b.fecha.localeCompare(a.fecha) || b.id - a.id;
                }
            });

            // Acumular totales
            registros.forEach(reg => {
                totalHoras += reg.horas;
                totalDinero += reg.ganado;
            });

            if (registrosFiltrados.length === 0) {
                registrosTabla.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 15px;">No hay registros encontrados.</td></tr>`;
            } else {
                registrosFiltrados.forEach(reg => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${formatearFecha(reg.fecha)}</td>
                        <td>${reg.cliente || '-'}</td>
                        <td>${reg.servicio || reg.notas || '-'}</td>
                        <td>${reg.horas.toFixed(2)} h</td>
                        <td>€${reg.ganado.toFixed(2)}</td>
                        <td><button class="btn-delete" onclick="eliminarRegistro(${reg.id})">🗑️</button></td>
                    `;
                    registrosTabla.appendChild(tr);
                });
            }

            if (totalHorasEl) totalHorasEl.textContent = `${totalHoras.toFixed(2)} hrs`;
            if (totalDineroEl) totalDineroEl.textContent = `€${totalDinero.toFixed(2)}`;
        }

        // Renderizar Lista de Tareas Programadas
        if (listaTareas) {
            listaTareas.innerHTML = '';
            if (tareas.length === 0) {
                listaTareas.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 10px;">No hay tareas programadas.</p>';
            } else {
                let tareasOrdenadas = [...tareas].sort((a, b) => a.fecha.localeCompare(b.fecha));

                tareasOrdenadas.forEach(t => {
                    const div = document.createElement('div');
                    div.className = `task-card ${t.completada ? 'completed' : ''}`;
                    const monto = t.totalCalculado !== undefined ? t.totalCalculado : (t.ganado || 0);
                    const titulo = t.nombre || t.servicio || 'Tarea Programada';
                    
                    div.innerHTML = `
                        <div class="task-info">
                            <input type="checkbox" class="task-checkbox" ${t.completada ? 'checked' : ''} onchange="toggleTarea(${t.id})">
                            <div class="task-details">
                                <h4>${titulo}</h4>
                                ${t.cliente ? `<p>👤 <strong>Cliente:</strong> ${t.cliente}</p>` : ''}
                                <p>📅 ${formatearFecha(t.fecha)} ${t.horasEstimadas ? '• ' + t.horasEstimadas.toFixed(2) + ' hrs' : ''}</p>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span class="task-amount">€${monto.toFixed(2)}</span>
                            <button class="btn-delete" onclick="eliminarTarea(${t.id})">🗑️</button>
                        </div>
                    `;
                    listaTareas.appendChild(div);
                });
            }
        }
    }

    // Marcar tarea como completada -> Se elimina de tareas y pasa al historial
    window.toggleTarea = (id) => {
        const tareaCompletada = tareas.find(t => t.id === id);
        
        if (tareaCompletada) {
            // Se remueve de Próximas Tareas
            tareas = tareas.filter(t => t.id !== id);

            // Se añade al Historial General de Registros
            registros.unshift({
                id: Date.now(),
                fecha: tareaCompletada.fecha,
                cliente: tareaCompletada.cliente || 'General',
                servicio: tareaCompletada.nombre || tareaCompletada.servicio || 'Tarea Programada',
                horas: tareaCompletada.horasEstimadas || 0,
                ganado: tareaCompletada.totalCalculado !== undefined ? tareaCompletada.totalCalculado : (tareaCompletada.ganado || 0)
            });

            guardarYActualizar();
        }
    };

    window.eliminarRegistro = (id) => {
        registros = registros.filter(r => r.id !== id);
        guardarYActualizar();
    };

    window.eliminarTarea = (id) => {
        tareas = tareas.filter(t => t.id !== id);
        guardarYActualizar();
    };

    function formatearFecha(fechaStr) {
        if(!fechaStr) return '';
        const [ano, mes, dia] = fechaStr.split('-');
        return `${dia}/${mes}/${ano.slice(2)}`;
    }
});