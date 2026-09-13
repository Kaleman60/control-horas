document.addEventListener('DOMContentLoaded', () => {
    // Control de Pestañas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
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

    // Fecha predeterminada (Hoy)
    const today = new Date().toISOString().split('T')[0];
    fechaInput.value = today;
    taskFechaInput.value = today;

    // Cargar datos guardados
    let registros = JSON.parse(localStorage.getItem('registros_trabajo')) || [];
    let tareas = JSON.parse(localStorage.getItem('tareas_programadas')) || [];
    
    const ultimaTarifa = localStorage.getItem('ultima_tarifa');
    if (ultimaTarifa) {
        tarifaInput.value = ultimaTarifa;
        document.getElementById('task-precio').value = ultimaTarifa;
    }

    // Cambiar dinámicamente inputs de tarea según tipo de pago
    taskTipoPago.addEventListener('change', () => {
        if (taskTipoPago.value === 'fijo') {
            groupHorasEst.style.display = 'none';
            labelPrecioTarea.textContent = 'Precio Total Fijo (€ o $)';
        } else {
            groupHorasEst.style.display = 'flex';
            labelPrecioTarea.textContent = 'Precio por Hora (€ o $)';
        }
    });

    actualizarInterfaz();

    // Guardar Jornada Trabajada
    formWork.addEventListener('submit', (e) => {
        e.preventDefault();
        const fecha = document.getElementById('fecha').value;
        const horaInicio = document.getElementById('hora-inicio').value;
        const horaFin = document.getElementById('hora-fin').value;
        const descansoMin = parseInt(document.getElementById('descanso').value) || 0;
        const tarifa = parseFloat(document.getElementById('tarifa').value);
        const notas = document.getElementById('notas').value;

        const inicio = new Date(`${fecha}T${horaInicio}`);
        const fin = new Date(`${fecha}T${horaFin}`);
        let difMin = (fin - inicio) / (1000 * 60) - descansoMin;

        if (difMin <= 0) {
            alert("La hora de fin debe ser posterior a la de inicio.");
            return;
        }

        const horas = difMin / 60;
        const ganado = horas * tarifa;

        localStorage.setItem('ultima_tarifa', tarifa);

        registros.unshift({
            id: Date.now(),
            fecha,
            horas,
            ganado,
            notas
        });

        guardarYActualizar();
        document.getElementById('hora-inicio').value = '';
        document.getElementById('hora-fin').value = '';
        document.getElementById('descanso').value = '0';
        document.getElementById('notas').value = '';
    });

    // Guardar Nueva Tarea Programada
    formTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('task-nombre').value;
        const fecha = document.getElementById('task-fecha').value;
        const tipoPago = document.getElementById('task-tipo-pago').value;
        const precio = parseFloat(document.getElementById('task-precio').value);

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

    function guardarYActualizar() {
        localStorage.setItem('registros_trabajo', JSON.stringify(registros));
        localStorage.setItem('tareas_programadas', JSON.stringify(tareas));
        actualizarInterfaz();
    }

    function actualizarInterfaz() {
        // Renderizar Tabla de Jornadas
        registrosTabla.innerHTML = '';
        let totalHoras = 0;
        let totalDinero = 0;

        registros.forEach(reg => {
            totalHoras += reg.horas;
            totalDinero += reg.ganado;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatearFecha(reg.fecha)}</td>
                <td>${reg.horas.toFixed(2)} h</td>
                <td>$${reg.ganado.toFixed(2)}</td>
                <td>${reg.notas || '-'}</td>
                <td><button class="btn-delete" onclick="eliminarRegistro(${reg.id})">🗑️</button></td>
            `;
            registrosTabla.appendChild(tr);
        });

        // Sumar también las tareas marcadas como realizadas (check)
        tareas.forEach(t => {
            if (t.completada) {
                totalDinero += t.totalCalculado;
                totalHoras += t.horasEstimadas;
            }
        });

        totalHorasEl.textContent = `${totalHoras.toFixed(2)} hrs`;
        totalDineroEl.textContent = `$${totalDinero.toFixed(2)}`;

        // Renderizar Lista de Tareas
        listaTareas.innerHTML = '';
        if (tareas.length === 0) {
            listaTareas.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 10px;">No hay tareas programadas.</p>';
        } else {
            tareas.forEach(t => {
                const div = document.createElement('div');
                div.className = `task-card ${t.completada ? 'completed' : ''}`;
                div.innerHTML = `
                    <div class="task-info">
                        <input type="checkbox" class="task-checkbox" ${t.completada ? 'checked' : ''} onchange="toggleTarea(${t.id})">
                        <div class="task-details">
                            <h4>${t.nombre}</h4>
                            <p>📅 ${formatearFecha(t.fecha)} ${t.horasEstimadas ? '• ' + t.horasEstimadas + ' hrs est.' : '• Precio Fijo'}</p>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="task-amount">$${t.totalCalculado.toFixed(2)}</span>
                        <button class="btn-delete" onclick="eliminarTarea(${t.id})">🗑️</button>
                    </div>
                `;
                listaTareas.appendChild(div);
            });
        }
    }

    window.toggleTarea = (id) => {
        tareas = tareas.map(t => {
            if (t.id === id) {
                return { ...t, completada: !t.completada };
            }
            return t;
        });
        guardarYActualizar();
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