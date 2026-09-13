document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('work-form');
    const fechaInput = document.getElementById('fecha');
    const tarifa_input = document.getElementById('tarifa');
    const registroTabla = document.getElementById('registro-tabla');
    const totalHoras = document.getElementById('total-horas');
    const totalDinero = document.getElementById('total-dinero');

    //Se establece la hora actual 
    fechaInput.value = new Date().toISOString().split('T')[0];

    let registros = JSON.parse(localStorage.getItem('registros_trabajo')) || [];
    const ultimaTarifa = localStorage.getItem('ultima_tarifa');
    if (ultimaTarifa) {
        tarifaInput.value = ultimaTarifa;
    }

    // Renderizar datos iniciales
    actualizarInterfaz();

   form.addEventListener('submit', (e) => {
        e.preventDefault();

        const fecha = document.getElementById('fecha').value;
        const horaInicio = document.getElementById('hora-inicio').value;
        const horaFin = document.getElementById('hora-fin').value;
        const descansoMin = parseInt(document.getElementById('descanso').value) || 0;
        const tarifa = parseFloat(document.getElementById('tarifa').value);
        const notas = document.getElementById('notas').value;

        // Calcular minutos trabajados
        const inicio = new Date(`${fecha}T${horaInicio}`);
        const fin = new Date(`${fecha}T${horaFin}`);

        let diferenciaMinutos = (fin - inicio) / (1000 * 60) - descansoMin;

        if (diferenciaMinutos <= 0) {
            alert("La hora de fin debe ser posterior a la de inicio tras restar el descanso.");
            return;
        }

        const horasTrabajadas = diferenciaMinutos / 60;
        const dineroGanado = horasTrabajadas * tarifa;

        // Guardar la tarifa habitual
        localStorage.setItem('ultima_tarifa', tarifa);

        // Crear el objeto del registro
        const nuevoRegistro = {
            id: Date.now(),
            fecha,
            horas: horasTrabajadas,
            ganado: dineroGanado,
            notas
        };

        registros.unshift(nuevoRegistro); // Insertar al inicio
        guardarYActualizar();

        // Resetear horas pero conservar tarifa y fecha
        document.getElementById('hora-inicio').value = '';
        document.getElementById('hora-fin').value = '';
        document.getElementById('descanso').value = '0';
        document.getElementById('notas').value = '';
    });

    function guardarYActualizar() {
        localStorage.setItem('registros_trabajo', JSON.stringify(registros));
        actualizarInterfaz();
    }

    function actualizarInterfaz() {
        // Limpiar tabla
        registrosTabla.innerHTML = '';

        let totalHoras = 0;
        let totalDinero = 0;

        if (registros.length === 0) {
            registrosTabla.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Sin registros aún.</td></tr>`;
        } else {
            registros.forEach(reg => {
                totalHoras += reg.horas;
                totalDinero += reg.ganado;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatearFecha(reg.fecha)}</td>
                    <td>${reg.horas.toFixed(2)} h</td>
                    <td>$${reg.ganado.toFixed(2)}</td>
                    <td>${reg.notas || '-'}</td>
                    <td><button class="btn-delete" data-id="${reg.id}">🗑️</button></td>
                `;
                registrosTabla.appendChild(tr);
            });
        }

        // Actualizar métricas del dashboard
        totalHorasEl.textContent = `${totalHoras.toFixed(2)} hrs`;
        totalDineroEl.textContent = `$${totalDinero.toFixed(2)}`;

        // Asignar eventos de borrado
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                registros = registros.filter(r => r.id !== id);
                guardarYActualizar();
            });
        });
    }

    function formatearFecha(fechaStr) {
        const [ano, mes, dia] = fechaStr.split('-');
        return `${dia}/${mes}/${ano.slice(2)}`;
    }

});