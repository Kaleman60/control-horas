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

    // Elementos de Búsqueda, Filtro de Mes y Ordenación
    const ordenSelect = document.getElementById('orden-historial');
    const buscarClienteInput = document.getElementById('buscar-cliente');
    const filtroMesSelect = document.getElementById('filtro-mes');

    // Escuchadores de eventos para Búsqueda, Filtros y Orden
    if (ordenSelect) ordenSelect.addEventListener('change', actualizarInterfaz);
    if (buscarClienteInput) buscarClienteInput.addEventListener('input', actualizarInterfaz);
    if (filtroMesSelect) filtroMesSelect.addEventListener('change', actualizarInterfaz);

    // Fecha predeterminada (Hoy local YYYY-MM-DD)
    const hoyObj = new Date();
    const hoyStr = hoyObj.getFullYear() + '-' + 
                   String(hoyObj.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(hoyObj.getDate()).padStart(2, '0');

    const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

    if (fechaInput) fechaInput.value = hoyStr;
    if (taskFechaInput) taskFechaInput.value = hoyStr;

    // Cargar datos guardados
    let registros = [];
    let tareas = [];
    try {
        registros = JSON.parse(localStorage.getItem('registros_trabajo')) || [];
        tareas = JSON.parse(localStorage.getItem('tareas_programadas')) || [];
    } catch (err) {
        console.error('Error leyendo datos guardados:', err);
    }

    // Normaliza registros antiguos que tengan campos faltantes (no borra nada)
    registros = registros.map((r, i) => {
        const horas = Number(r.horas) || 0;
        const tarifa = Number(r.tarifa) || 0;
        return {
            ...r,
            id: r.id || Date.now() + i,
            fecha: r.fecha || '',
            cliente: r.cliente || 'Sin cliente',
            servicio: r.servicio || 'Servicio General',
            horas,
            tarifa,
            ganado: Number(r.ganado) || horas * tarifa
        };
    });
    
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
                    horaInicio,
                    horaFin,
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
                    horaInicio,
                    horaFin,
                    horas,
                    tarifa,
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

    // "2026-10-02" -> "2 oct 2026" (solo para mostrar, no cambia lo guardado)
    function formatearFecha(fechaStr) {
        if (!fechaStr) return '-';
        const [ano, mes, dia] = fechaStr.split('-').map(Number);
        return `${dia} ${MESES_CORTOS[mes - 1]} ${ano}`;
    }

    // Días que faltan desde hoy hasta la fecha (negativo = ya pasó)
    function diasHasta(fechaStr) {
        const [a, m, d] = fechaStr.split('-').map(Number);
        const [ah, mh, dh] = hoyStr.split('-').map(Number);
        return Math.round((new Date(a, m - 1, d) - new Date(ah, mh - 1, dh)) / 86400000);
    }

    function guardarYActualizar() {
        localStorage.setItem('registros_trabajo', JSON.stringify(registros));
        localStorage.setItem('tareas_programadas', JSON.stringify(tareas));
        actualizarInterfaz();
    }

    // Rellena el desplegable con los meses que tienen registros guardados
    function poblarFiltroMeses() {
        if (!filtroMesSelect) return;
        const opcionSeleccionada = filtroMesSelect.value || 'todos';
        filtroMesSelect.innerHTML = '<option value="todos">Todos los meses</option>';

        const mesesSet = new Set();
        registros.forEach(reg => {
            if (reg.fecha) {
                const [ano, mes] = reg.fecha.split('-');
                mesesSet.add(`${ano}-${mes}`);
            }
        });

        const mesesOrdenados = Array.from(mesesSet).sort().reverse();
        const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        mesesOrdenados.forEach(mesAno => {
            const [ano, mes] = mesAno.split('-');
            const option = document.createElement('option');
            option.value = mesAno;
            option.textContent = `${nombresMeses[parseInt(mes) - 1]} ${ano}`;
            filtroMesSelect.appendChild(option);
        });

        filtroMesSelect.value = opcionSeleccionada;
        if (filtroMesSelect.value !== opcionSeleccionada) filtroMesSelect.value = 'todos';
    }

    function actualizarInterfaz() {
        poblarFiltroMeses();

        // Renderizar Tabla de Jornadas Realizadas
        if (registrosTabla) {
            registrosTabla.innerHTML = '';
            let totalHoras = 0;
            let totalDinero = 0;

            const orden = ordenSelect ? ordenSelect.value : 'reciente';
            const textoBusqueda = buscarClienteInput ? buscarClienteInput.value.toLowerCase().trim() : '';
            const mesFiltrado = filtroMesSelect ? filtroMesSelect.value : 'todos';

            // 1. Filtrar registros por cliente y mes seleccionado
            let registrosFiltrados = registros.filter(reg => {
                const cliente = (reg.cliente || '').toLowerCase();
                const coincideCliente = cliente.includes(textoBusqueda);
                
                let coincideMes = true;
                if (mesFiltrado !== 'todos' && reg.fecha) {
                    coincideMes = reg.fecha.startsWith(mesFiltrado);
                }

                return coincideCliente && coincideMes;
            });

            // 2. Ordenar el historial
            registrosFiltrados.sort((a, b) => {
                if (orden === 'antiguo') {
                    return a.fecha.localeCompare(b.fecha) || a.id - b.id;
                } else {
                    return b.fecha.localeCompare(a.fecha) || b.id - a.id;
                }
            });

            // 3. Renderizar registros filtrados
            registrosFiltrados.forEach(reg => {
                const tr = document.createElement('tr');
                tr.dataset.id = reg.id;
                tr.innerHTML = `
                    <td><span class="fecha-chip">${formatearFecha(reg.fecha)}</span></td>
                    <td>${reg.cliente}</td>
                    <td>${reg.servicio}</td>
                    <td>${reg.horas.toFixed(2)}</td>
                    <td>${reg.tarifa.toFixed(2)}</td>
                    <td>${reg.ganado.toFixed(2)}</td>
                    <td><button type="button" class="btn-delete" title="Eliminar" data-accion="borrar-registro" data-id="${reg.id}">🗑️</button></td>
                `;
                registrosTabla.appendChild(tr);
            });

            // 4. Calcular totales
            totalHoras = registrosFiltrados.reduce((sum, reg) => sum + reg.horas, 0);
            totalDinero = registrosFiltrados.reduce((sum, reg) => sum + reg.ganado, 0);

            if (totalHorasEl) totalHorasEl.textContent = totalHoras.toFixed(2) + ' hrs';
            if (totalDineroEl) totalDineroEl.textContent = '€' + totalDinero.toFixed(2);
        }

        // Renderizar lista de tareas programadas
        if (listaTareas) {
            listaTareas.innerHTML = '';
            const pendientes = tareas.filter(t => !t.completada)
                                     .sort((a, b) => a.fecha.localeCompare(b.fecha));

            if (pendientes.length === 0) {
                listaTareas.innerHTML = '<div class="tasks-empty">📭 No hay tareas programadas</div>';
            }

            pendientes.forEach(t => {
                const [ano, mes, dia] = t.fecha.split('-').map(Number);
                const dias = diasHasta(t.fecha);
                let etiqueta, clase = '';
                if (dias === 0) { etiqueta = 'Hoy'; clase = 'hoy'; }
                else if (dias === 1) { etiqueta = 'Mañana'; }
                else if (dias > 1) { etiqueta = `En ${dias} días`; }
                else { etiqueta = `Hace ${Math.abs(dias)} días`; clase = 'vencida'; }

                const horasTxt = t.horasEstimadas > 0 ? ` · ${t.horasEstimadas.toFixed(1)} h` : '';

                const div = document.createElement('div');
                div.className = 'task-card';
                div.innerHTML = `
                    <div class="task-info">
                        <div class="task-date">
                            <span class="dia">${dia}</span>
                            <span class="mes">${MESES_CORTOS[mes - 1]}</span>
                        </div>
                        <div class="task-details">
                            <h4>${t.nombre}</h4>
                            <p>${t.cliente}${horasTxt} <span class="task-badge ${clase}">${etiqueta}</span></p>
                        </div>
                    </div>
                    <div class="task-actions">
                        <span class="task-amount">€${t.totalCalculado.toFixed(2)}</span>
                        <button type="button" class="btn-done" title="Marcar como hecha" data-accion="completar" data-id="${t.id}">✅</button>
                        <button type="button" class="btn-delete" title="Eliminar" data-accion="eliminar" data-id="${t.id}">🗑️</button>
                    </div>
                `;
                listaTareas.appendChild(div);
            });
        }
    }

    // Formatea horas decimales como "Xh Ym"
    function formatoHoras(horas) {
        let h = Math.floor(horas);
        let m = Math.round((horas - h) * 60);
        if (m === 60) { h += 1; m = 0; }
        return `${h}h ${m}min`;
    }

    // Cambiar el precio/hora de TODO el historial y recalcular lo ganado
    const btnAplicarPrecio = document.getElementById('btn-aplicar-precio');
    const nuevoPrecioInput = document.getElementById('nuevo-precio-historial');
    if (btnAplicarPrecio && nuevoPrecioInput) {
        btnAplicarPrecio.addEventListener('click', () => {
            const nuevoPrecio = parseFloat(nuevoPrecioInput.value);
            if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
                alert('Escribe un precio válido.');
                return;
            }
            const mesSel = filtroMesSelect ? filtroMesSelect.value : 'todos';
            if (mesSel === 'todos') {
                alert('Primero selecciona un mes en el filtro de meses.');
                return;
            }

            const delMes = registros.filter(r => r.fecha && r.fecha.startsWith(mesSel));
            if (delMes.length === 0) {
                alert('No hay registros en el mes seleccionado.');
                return;
            }

            const nombreMes = filtroMesSelect.options[filtroMesSelect.selectedIndex].textContent;
            const totalHorasMes = delMes.reduce((s, r) => s + r.horas, 0);
            const totalNuevo = totalHorasMes * nuevoPrecio;

            const ok = confirm(
                `Se cambiará el precio a ${nuevoPrecio.toFixed(2)} €/hora SOLO en ${nombreMes} (${delMes.length} registros).\n\n` +
                `Horas totales del mes: ${totalHorasMes.toFixed(2)} (${formatoHoras(totalHorasMes)})\n` +
                `Total ganado con el nuevo precio: ${totalNuevo.toFixed(2)} €\n\n¿Continuar?`
            );
            if (!ok) return;

            registros = registros.map(r => (r.fecha && r.fecha.startsWith(mesSel))
                ? { ...r, tarifa: nuevoPrecio, ganado: r.horas * nuevoPrecio }
                : r
            );
            localStorage.setItem('ultima_tarifa', nuevoPrecio);
            if (tarifaInput) tarifaInput.value = nuevoPrecio;
            nuevoPrecioInput.value = '';
            guardarYActualizar();
        });
    }

    // Al tocar un registro, mostrar cuántas horas fueron y cuánto se ganó
    if (registrosTabla) {
        registrosTabla.style.cursor = 'pointer';
        registrosTabla.addEventListener('click', (e) => {
            // Eliminar un registro del historial
            const btnBorrar = e.target.closest('button[data-accion="borrar-registro"]');
            if (btnBorrar) {
                const id = Number(btnBorrar.dataset.id);
                const reg = registros.find(r => r.id === id);
                if (!reg) return;
                if (confirm(`¿Eliminar este registro?\n\n${formatearFecha(reg.fecha)} · ${reg.cliente} · ${reg.servicio}\n${reg.horas.toFixed(2)} h · ${reg.ganado.toFixed(2)} €`)) {
                    registros = registros.filter(r => r.id !== id);
                    guardarYActualizar();
                }
                return;
            }

            const tr = e.target.closest('tr');
            if (!tr || !tr.dataset.id) return;
            const reg = registros.find(r => r.id === Number(tr.dataset.id));
            if (!reg) return;
            alert(
                `📅 ${reg.fecha}\n` +
                `👤 ${reg.cliente}\n` +
                `🧹 ${reg.servicio}\n` +
                `🕒 Horario: ${reg.horaInicio && reg.horaFin ? reg.horaInicio + ' a ' + reg.horaFin : 'no registrado'}\n\n` +
                `⏱️ Horas: ${reg.horas.toFixed(2)} (${formatoHoras(reg.horas)})\n` +
                `💶 Precio/hora: ${reg.tarifa.toFixed(2)} €\n` +
                `💰 Ganado: ${reg.ganado.toFixed(2)} €`
            );

            // Si es un registro viejo sin horario, permitir agregarlo
            if (!reg.horaInicio || !reg.horaFin) {
                if (!confirm('Este registro no tiene horario guardado.\n¿Quieres agregarlo ahora?')) return;
                const valida = (t) => /^([01]?\d|2[0-3]):[0-5]\d$/.test((t || '').trim());
                const fmt = (t) => t.trim().padStart(5, '0');
                const ini = prompt('Hora de inicio (formato 24h, ej: 09:00):');
                if (ini === null) return;
                const fin = prompt('Hora de fin (formato 24h, ej: 10:30):');
                if (fin === null) return;
                if (!valida(ini) || !valida(fin)) {
                    alert('Formato no válido. Usa HH:MM, por ejemplo 09:00.');
                    return;
                }
                reg.horaInicio = fmt(ini);
                reg.horaFin = fmt(fin);
                guardarYActualizar();
            }
        });
    }

    // Acciones de las tareas programadas
    if (listaTareas) {
        listaTareas.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-accion]');
            if (!btn) return;
            const id = Number(btn.dataset.id);
            const tarea = tareas.find(t => t.id === id);
            if (!tarea) return;

            if (btn.dataset.accion === 'completar') {
                registros.unshift({
                    id: Date.now(),
                    fecha: tarea.fecha,
                    cliente: tarea.cliente,
                    servicio: tarea.nombre,
                    horaInicio: tarea.horaInicio,
                    horaFin: tarea.horaFin,
                    horas: tarea.horasEstimadas,
                    tarifa: tarea.precio,
                    ganado: tarea.totalCalculado
                });
            }
            tareas = tareas.filter(t => t.id !== id);
            guardarYActualizar();
        });
    }
});