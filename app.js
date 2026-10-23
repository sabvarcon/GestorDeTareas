
"use strict";

// Clave que identifica los datos guardados en el navegador.
const CLAVE_ALMACENAMIENTO = "gestorTareas.v1";

// ==================================================
// CLASE TAREA
// Representa una tarea individual.
// ==================================================

class Tarea {
    constructor(nombre, completa = false, id = crypto.randomUUID()) {
        this.id = id;
        this.nombre = nombre;
        this.completa = completa;
    }

    // Cambia una tarea de pendiente a completada o viceversa.
    cambiarEstado() {
        this.completa = !this.completa;
    }

    // Actualiza la descripción de la tarea.
    editar(nuevoNombre) {
        this.nombre = nuevoNombre;
    }

    // Reconstruye una instancia a partir de los datos guardados.
    static desdeObjeto(objeto) {
        return new Tarea(
            objeto.nombre,
            objeto.completa,
            objeto.id
        );
    }
}

// ==================================================
// CLASE GESTOR DE TAREAS
// Administra la colección y las operaciones.
// ==================================================

class GestorDeTareas {
    constructor() {
        this.tareas = [];
    }

    // Recupera las tareas guardadas en el navegador.
    async cargar() {
        try {
            const datos = await Promise.resolve().then(() => {
                return localStorage.getItem(CLAVE_ALMACENAMIENTO);
            });

            const guardadas = datos ? JSON.parse(datos) : [];

            if (!Array.isArray(guardadas)) {
                throw new Error("El formato de los datos no es válido.");
            }

            this.tareas = guardadas.map((objeto) => {
                return Tarea.desdeObjeto(objeto);
            });

            this.render();
        } catch (error) {
            console.error("Error al cargar las tareas:", error);
            this.tareas = [];
            this.render();

            this.mostrarMensaje(
                "No se pudieron recuperar las tareas guardadas.",
                true
            );
        }
    }

    // Guarda el estado actual de la colección.
    async guardar() {
        try {
            await Promise.resolve().then(() => {
                localStorage.setItem(
                    CLAVE_ALMACENAMIENTO,
                    JSON.stringify(this.tareas)
                );
            });

            return true;
        } catch (error) {
            console.error("Error al guardar las tareas:", error);

            this.mostrarMensaje(
                "No se pudieron guardar los cambios en el navegador.",
                true
            );

            return false;
        }
    }

    // Agrega una tarea nueva después de validar su nombre.
    async agregarTarea(nombre) {
        const nombreLimpio = nombre.trim();

        if (!nombreLimpio) {
            this.mostrarMensaje(
                "Escribe una tarea antes de agregarla.",
                true
            );
            return false;
        }

        const tarea = new Tarea(nombreLimpio);
        this.tareas.push(tarea);

        const guardado = await this.guardar();

        if (!guardado) {
            this.tareas = this.tareas.filter(
                (elemento) => elemento.id !== tarea.id
            );

            this.render();
            return false;
        }

        this.render();
        this.mostrarMensaje("¡Tarea agregada correctamente!");
        return true;
    }

    // Busca y modifica una tarea existente.
    async editarTarea(id, nuevoNombre) {
        const nombreLimpio = nuevoNombre.trim();

        if (!nombreLimpio) {
            this.mostrarMensaje(
                "La descripción no puede estar vacía.",
                true
            );
            return false;
        }

        const tarea = this.tareas.find(
            (elemento) => elemento.id === id
        );

        if (!tarea) {
            this.mostrarMensaje("No se encontró la tarea.", true);
            return false;
        }

        const nombreAnterior = tarea.nombre;
        tarea.editar(nombreLimpio);

        const guardado = await this.guardar();

        if (!guardado) {
            tarea.editar(nombreAnterior);
            this.render();
            return false;
        }

        this.render();
        this.mostrarMensaje("Tarea actualizada correctamente.");
        return true;
    }

    // Cambia el estado de una tarea.
    async cambiarEstado(id) {
        const tarea = this.tareas.find(
            (elemento) => elemento.id === id
        );

        if (!tarea) {
            return;
        }

        tarea.cambiarEstado();

        const guardado = await this.guardar();

        if (!guardado) {
            tarea.cambiarEstado();
        }

        this.render();
    }

    // Elimina una tarea utilizando su identificador único.
    async eliminarTarea(id) {
        const indice = this.tareas.findIndex(
            (tarea) => tarea.id === id
        );

        if (indice === -1) {
            return;
        }

        const [tareaEliminada] = this.tareas.splice(indice, 1);
        const guardado = await this.guardar();

        if (!guardado) {
            this.tareas.splice(indice, 0, tareaEliminada);
            this.render();
            return;
        }

        this.render();
        this.mostrarMensaje("Tarea eliminada correctamente.");
    }

    // Actualiza la lista y los indicadores de la interfaz.
    render() {
        const lista = document.querySelector("#lista-tareas");
        const estadoVacio = document.querySelector("#estado-vacio");

        const total = this.tareas.length;

        const completadas = this.tareas.filter(
            (tarea) => tarea.completa
        ).length;

        const pendientes = total - completadas;

        const porcentaje = total === 0
            ? 0
            : Math.round((completadas / total) * 100);

        // Elimina los elementos anteriores para dibujar la lista actual.
        lista.replaceChildren();

        // Recorre todas las tareas y crea sus elementos HTML.
        this.tareas.forEach((tarea) => {
            const elemento = document.createElement("li");

            elemento.className = tarea.completa
                ? "tarea completada"
                : "tarea";

            elemento.dataset.id = tarea.id;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "casilla-tarea";
            checkbox.checked = tarea.completa;
            checkbox.dataset.accion = "estado";

            checkbox.setAttribute(
                "aria-label",
                `Marcar ${tarea.nombre} como completada`
            );

            const nombre = document.createElement("span");
            nombre.className = "nombre-tarea";

            // textContent muestra el nombre como texto seguro.
            nombre.textContent = tarea.nombre;

            const acciones = document.createElement("div");
            acciones.className = "acciones-tarea";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "icono-boton";
            botonEditar.textContent = "Editar";
            botonEditar.dataset.accion = "editar";

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className =
                "icono-boton boton-eliminar";

            botonEliminar.textContent = "Eliminar";
            botonEliminar.dataset.accion = "eliminar";

            acciones.append(botonEditar, botonEliminar);
            elemento.append(checkbox, nombre, acciones);
            lista.append(elemento);
        });

        // Actualiza los indicadores de la interfaz.
        document.querySelector("#total-tareas").textContent = total;

        document.querySelector("#total-pendientes").textContent =
            pendientes;

        document.querySelector("#total-completadas").textContent =
            completadas;

        document.querySelector("#contador").textContent =
            `${total} ${total === 1 ? "tarea" : "tareas"}`;

        document.querySelector("#porcentaje").textContent =
            `${porcentaje}%`;

        document.querySelector("#relleno-progreso").style.width =
            `${porcentaje}%`;

        document.querySelector("#barra-progreso").setAttribute(
            "aria-valuenow",
            porcentaje
        );

        estadoVacio.hidden = total > 0;
    }

    // Muestra mensajes de confirmación o error.
    mostrarMensaje(texto, esError = false) {
        const mensaje = document.querySelector("#mensaje");

        mensaje.textContent = texto;
        mensaje.classList.toggle("error", esError);
    }
}

// ==================================================
// CONEXIÓN CON EL DOM Y MANEJO DE EVENTOS
// ==================================================

const gestor = new GestorDeTareas();

const formulario = document.querySelector("#formulario-tarea");
const entrada = document.querySelector("#nueva-tarea");

const dialogo = document.querySelector("#dialogo-edicion");
const formularioEdicion =
    document.querySelector("#formulario-edicion");

const textoEdicion = document.querySelector("#texto-edicion");
const cancelarEdicion = document.querySelector("#cancelar-edicion");

let idEnEdicion = null;

// Evento para agregar tareas.
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const agregado = await gestor.agregarTarea(entrada.value);

    if (agregado) {
        entrada.value = "";
        entrada.focus();
    }
});

// Delegación de eventos para los botones de editar y eliminar.
document.querySelector("#lista-tareas").addEventListener(
    "click",
    async (evento) => {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) {
            return;
        }

        const elemento = boton.closest("[data-id]");

        if (!elemento) {
            return;
        }

        const id = elemento.dataset.id;

        if (boton.dataset.accion === "editar") {
            const tarea = gestor.tareas.find(
                (elementoTarea) => elementoTarea.id === id
            );

            if (!tarea) {
                return;
            }

            idEnEdicion = id;
            textoEdicion.value = tarea.nombre;

            dialogo.showModal();
            textoEdicion.focus();
        }

        if (boton.dataset.accion === "eliminar") {
            await gestor.eliminarTarea(id);
        }
    }
);

// Evento para marcar una tarea como completada.
document.querySelector("#lista-tareas").addEventListener(
    "change",
    async (evento) => {
        if (
            !evento.target.matches(
                'input[data-accion="estado"]'
            )
        ) {
            return;
        }

        const elemento = evento.target.closest("[data-id]");

        if (elemento) {
            await gestor.cambiarEstado(elemento.dataset.id);
        }
    }
);

// Guarda los cambios realizados en la ventana de edición.
formularioEdicion.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const actualizado = await gestor.editarTarea(
        idEnEdicion,
        textoEdicion.value
    );

    if (actualizado) {
        dialogo.close();
    }
});

// Cierra la ventana sin guardar los cambios.
cancelarEdicion.addEventListener("click", () => {
    dialogo.close();
});

// Limpia el formulario cuando se cierra la ventana.
dialogo.addEventListener("close", () => {
    idEnEdicion = null;
    formularioEdicion.reset();
});

// Recupera las tareas guardadas al iniciar la aplicación.
document.addEventListener("DOMContentLoaded", () => {
    gestor.cargar();
});
