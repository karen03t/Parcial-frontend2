let ctx;
let canvas;
let listaPendientes;
let listaHoy;

const STORAGE_KEY = "agenda_eventos_v1";
const LIMITE_EVENTOS = 20;

function porId(id) {
    return document.getElementById(id);
}

function comenzar() {
    canvas = porId("grafico");
    ctx = canvas.getContext("2d");
    listaPendientes = porId("lista-pendientes");
    listaHoy = porId("lista-hoy");

    porId("btn-agregar").addEventListener("click", crearNuevoEvento);
    porId("nombre-evento").addEventListener("keydown", function (e) {
        if (e.key === "Enter") crearNuevoEvento();
    });

    iniciarGeolocalizacion();
    renderizarTodo();
}

function obtenerEventos() {
    const datos = localStorage.getItem(STORAGE_KEY);
    if (!datos) return [];
    try {
        const eventos = JSON.parse(datos);
        return Array.isArray(eventos) ? eventos : [];
    } catch (error) {
        return [];
    }
}

function guardarEventos(eventos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos));
}

function iniciarGeolocalizacion() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            mostrarMapa(pos.coords.latitude, pos.coords.longitude);
        },
        function () {},
        { enableHighAccuracy: true, timeout: 7000 }
    );
}

function mostrarMapa(lat, lon) {
    const src = "https://maps.google.com/maps?q=" + lat + "," + lon + "&z=15&output=embed";
    porId("ubicacion").innerHTML = '<iframe title="Mapa de ubicacion" src="' + src + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
}

function nombreRepetido(eventos, nombre) {
    for (let i = 0; i < eventos.length; i++) {
        if (eventos[i].nombre.toLowerCase() === nombre.toLowerCase()) return true;
    }
    return false;
}

function calcularEstadoInicial(nombre) {
    const n = nombre.toLowerCase();
    return n.indexOf("hoy") !== -1 || n.indexOf("urgente") !== -1 ? "hoy" : "pendientes";
}

function crearNuevoEvento() {
    const input = porId("nombre-evento");
    const nombre = input.value.trim();
    const eventos = obtenerEventos();

    if (nombre.length < 3) return alert("El nombre debe tener al menos 3 caracteres.");
    if (eventos.length >= LIMITE_EVENTOS) return alert("Se alcanzo el limite de 20 eventos.");
    if (nombreRepetido(eventos, nombre)) return alert("Ya existe un evento con ese nombre.");

    eventos.push({
        id: Date.now().toString(),
        nombre: nombre,
        estado: calcularEstadoInicial(nombre),
        creadoEn: new Date().toLocaleString("es-ES")
    });

    guardarEventos(eventos);
    input.value = "";
    renderizarTodo();
}

function crearTarjeta(evento) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";
    tarjeta.id = evento.id;
    tarjeta.draggable = true;
    tarjeta.innerHTML = "<strong>" + evento.nombre + "</strong><small>" + evento.creadoEn + "</small>";
    tarjeta.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", evento.id);
    });
    return tarjeta;
}

function renderizarTodo() {
    const eventos = obtenerEventos();
    listaPendientes.innerHTML = "";
    listaHoy.innerHTML = "";

    let countPendientes = 0;
    let countHoy = 0;

    for (let i = 0; i < eventos.length; i++) {
        const evento = eventos[i];
        const tarjeta = crearTarjeta(evento);
        if (evento.estado === "pendientes") {
            listaPendientes.appendChild(tarjeta);
            countPendientes++;
        } else {
            listaHoy.appendChild(tarjeta);
            countHoy++;
        }
    }

    actualizarCanvas(countPendientes, countHoy);
}

function permitirDrop(e) {
    e.preventDefault();
}

function buscarEventoPorId(eventos, id) {
    for (let i = 0; i < eventos.length; i++) {
        if (eventos[i].id === id) return eventos[i];
    }
    return null;
}

function soltar(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const eventos = obtenerEventos();
    const evento = buscarEventoPorId(eventos, id);
    if (!evento) return;

    evento.estado = e.currentTarget.id === "hoy" ? "hoy" : "pendientes";
    guardarEventos(eventos);
    renderizarTodo();
}

function actualizarCanvas(pendientes, hoy) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maxVal = Math.max(pendientes, hoy, 1);
    const baseY = 120;
    const escala = 90 / maxVal;
    const alturaPendientes = pendientes * escala;
    const alturaHoy = hoy * escala;

    ctx.font = "14px Arial";
    ctx.fillStyle = "#202124";
    ctx.fillText("Resumen de tareas", 145, 18);

    ctx.fillStyle = "#ea4335";
    ctx.fillRect(80, baseY - alturaPendientes, 70, alturaPendientes);
    ctx.fillStyle = "#202124";
    ctx.fillText("Pendientes: " + pendientes, 65, 142);

    ctx.fillStyle = "#34a853";
    ctx.fillRect(250, baseY - alturaHoy, 70, alturaHoy);
    ctx.fillStyle = "#202124";
    ctx.fillText("Realizadas: " + hoy, 260, 142);
}

function borrarTodo() {
    if (!confirm("Desea eliminar todas las tareas?")) return;
    localStorage.removeItem(STORAGE_KEY);
    renderizarTodo();
}