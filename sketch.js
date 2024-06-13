let g;
let trazos = [];
let cantidadTrazos = 7;
let imagesOnScreen = [];
let maxImages = 5;
let interval = 30; // Intervalo de generación de imágenes en frames
let lastGenTime = 0;
let deleteInterval = 20; // Intervalo para eliminar imágenes en frames
let lastDeleteTime = 0;

let minVibration = 0.5; // Mínimo desplazamiento de vibración
let maxVibration = 5;   // Máximo desplazamiento de vibración

let monitorear = false;

let FREC_MIN = 400; //no se si es grave -500 grave
let FREC_MAX = 900; //+500 agudo

let AMP_MIN = 0.9;
let AMP_MAX = 1;


let mic;
let pitch;
let audioCotext;

let gestorAmp;
let gestorPitch;

let haySonido; // estado de cómo está el sonido en cada momento
let antesHabiaSonido; // moemoria del estado anterior del sonido

const model_url = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';

let marca; //si me mantengo en silencio 3 seg en cada etapa pasa a la siguiente
let tiempoLimiteRojas = 3000;  //tiempoLimiteAgregar
let tiempoLimiteNegras = 3000;  //tiempoLimiteGrosor
let tiempoLimiteVibrar = 3000;  //tiempoLimiteColor
let tiempoLimiteDesaparecen = 3000;  //tiempoLimiteFin

function preload() {
    for (let i = 0; i < cantidadTrazos; i++) {
        let nombre = "data/trazo" + nf(i, 2) + ".png";
        trazos[i] = loadImage(nombre);
    }
    // Iniciar el contexto de audio
    userStartAudio();
}

function setup() {
    createCanvas(600,400); // Tamaño de la pantalla: ancho x alto
    background(255);
    imageMode(CENTER);
    g = new GestorDeInteraccion();

    audioContext = getAudioContext(); // inicia el motor de audio
    mic = new p5.AudioIn(); // inicia el micrófono
    mic.start(startPitch); // se enciende el micrófono y le transmito el analisis de frecuencia (pitch) al micrófono. Conecto la libreria con el micrófono
  
  
    userStartAudio();// por la dudas para forzar inicio de audio en algunos navegadores
  
    gestorAmp =  new GestorSenial( AMP_MIN, AMP_MAX);
    gestorPitch = new GestorSenial( FREC_MIN, FREC_MAX);
  
    antesHabiaSonido = false;
}

function draw() {
    g.actualizar();

    // Si el mouse está detenido, eliminar imágenes en el orden que aparecen
    if (g.mouseDetenido()) {
        if (frameCount - lastDeleteTime >= deleteInterval && imagesOnScreen.length > 0) {
            imagesOnScreen.shift();
            lastDeleteTime = frameCount;
        }
    } else {
        // Controlar la generación de imágenes con un temporizador
       /*  if (frameCount - lastGenTime >= interval) {
            if (mouseY < height / 2) {
                crearPeques();
            } else {
                crearGrandes();
            }
            lastGenTime = frameCount;
        } */
    }



    //SEPARAR EL CODIGO EN FUNCIONES DIFERENTES!!!
    //ESTÁ MAL SCROLLEAR UNA FUNCION, EL CODIGO TIENE QUE SER INDEPENDIENTE


    // Dibujar todas las imágenes actualmente en pantalla
    for (let i = 0; i < imagesOnScreen.length; i++) {
        let currentImage = imagesOnScreen[i];

        // Ajustar la vibración en función de la velocidad del mouse
        let vibrationAmount = map(g.mouse.velocidad(), 0, 50, minVibration, maxVibration);
        let offsetX = random(-vibrationAmount, vibrationAmount); // Vibración en X
        let offsetY = random(-vibrationAmount, vibrationAmount); // Vibración en Y

        push();
        translate(currentImage.x + offsetX, currentImage.y + offsetY);  // Mover el origen al punto donde quieres dibujar la imagen
        rotate(currentImage.rotation);  // Aplicar la rotación
        tint(currentImage.tint);  // Aplicar el tinte
        imageMode(CENTER);  // Dibujar la imagen desde su centro
        image(currentImage.img, 0, 0, currentImage.width, currentImage.height);  // Dibuja la imagen
        pop();
    }

    let vol = mic.getLevel(); // cargo en vol la amplitud del micrófono (señal cruda);
    gestorAmp.actualizar(vol);
  
    haySonido = gestorAmp.filtrada > 0.1; // umbral de ruido que define el estado haySonido
  
    let inicioElSonido = haySonido && !antesHabiaSonido; // evento de inicio de un sonido
    let finDelSonido = !haySonido && antesHabiaSonido; // evento de fin de un sonido
  
    antesHabiaSonido = haySonido; // Actualizar el estado anterior del sonido
    console.log("filtrada",gestorPitch.filtrada)
    if (!haySonido) { // Si no hay sonido, ejecutar mouseDetenido
        g.mouseDetenido();
    } else {
        // Si hay sonido y se detecta FREC_MIN, ejecutar crearGrandes
        
        if (gestorAmp.filtrada < AMP_MIN) {
            console.log("entró a grandes")
            crearGrandes();
        }
        // Si hay sonido y se detecta FREC_MAX, ejecutar crearPeques
        else if (gestorAmp.filtrada > AMP_MAX) {
            console.log("entró a peques")
            crearPeques();
        }
    }
}

function crearGrandes() { //líneas negras
    let cual = int(random(trazos.length));
    let x = random(width);
    let y = random(height/3);
    let originalWidth = trazos[cual].width;
    let originalHeight = trazos[cual].height;
    let newWidth = random(750,700); // Define the new width
    let newHeight = originalHeight * (newWidth / originalWidth); // Adjust height proportionally
    let rotation = random(TWO_PI);
    let img = {
        img: trazos[cual],
        x: x,
        y: y,
        width: newWidth,
        height: newHeight,
        tint: [random(0), random(0), random(0), 230],
        rotation: rotation
    };

    if (imagesOnScreen.length >= maxImages) {
        imagesOnScreen.shift();
    }

    imagesOnScreen.push(img);
}

function crearPeques() { //líneas rojas
    let cual = int(random(trazos.length));
    let x = random(width/3);
    let y = random(height);
    let originalWidth = trazos[cual].width;
    let originalHeight = trazos[cual].height;
    let newWidth = random(750,700); 
    let newHeight = originalHeight * (newWidth / originalWidth); 
    let rotation = random(TWO_PI);
    let img = {
        img: trazos[cual],
        x: x,
        y: y,
        width: newWidth,
        height: newHeight,
        tint: [random(200, 255), random(0), random(0), 230],
        rotation: rotation
    };

    if (imagesOnScreen.length >= maxImages) {
        imagesOnScreen.shift();
    }

    imagesOnScreen.push(img);
}

class Dir_y_Vel {
    constructor() {
        this.posX = 0;
        this.posY = 0;
        this.prevPosX = 0;
        this.prevPosY = 0;
        this.vel = 0;
    }

    calcularTodo(mi_X, mi_Y) {
        this.prevPosX = this.posX;
        this.prevPosY = this.posY;
        this.posX = mi_X;
        this.posY = mi_Y;

        this.miDireccionX = this.posX - this.prevPosX;
        this.miDireccionY = this.posY - this.prevPosY;
        this.miDireccionPolar = degrees(atan2(this.posY - this.prevPosY, this.posX - this.prevPosX));

        this.vel = dist(this.posX, this.posY, this.prevPosX, this.prevPosY);
    }

    velocidad() {
        return this.vel;
    }

    direccionX() {
        return this.miDireccionX;
    }

    direccionY() {
        return this.miDireccionY;
    }

    direccionPolar() {
        return this.miDireccionPolar;
    }

    mostrarData() {
        textSize(24);
        text("Velocidad: " + this.vel, 50, 50);
        text("Direccion X: " + this.miDireccionX, 50, 75);
        text("Direccion Y: " + this.miDireccionY, 50, 100);
        text("Direccion Polar: " + this.miDireccionPolar, 50, 125);

        push();
        noFill();
        stroke(255);
        strokeWeight(3);
        translate(width / 2, height / 2);

        ellipse(0, 0, 100, 100);
        rotate(radians(this.miDireccionPolar));
        line(0, 0, this.vel * 2, 0);

        pop();
    }
}

class GestorDeInteraccion {
    constructor() {
        this.mouse = new Dir_y_Vel();
        this.movGrande = false;
        this.movPeque = false;
        this.tiempoGrande = 0;
        this.tiempoPeque = 0;
    }

    actualizar() {
        this.mouse.calcularTodo(mouseX, mouseY);
        this.movGrande = false;
        this.movPeque = false;
        this.tiempoGrande--;
        this.tiempoPeque--;
        this.tiempoGrande = constrain(this.tiempoGrande, 0, 90);
        this.tiempoPeque = constrain(this.tiempoPeque, 0, 90);

        if (this.mouse.velocidad() > 10) {
            let umbral = 40;
            if (this.mouse.velocidad() > umbral) {
                this.tiempoGrande += 10;
                this.tiempoPeque -= 10;
            } else {
                if (this.tiempoGrande < 10) {
                    this.tiempoPeque += 10;
                }
            }
        }

        if (this.tiempoGrande > 55) {
            this.movGrande = true;
        }
        if (this.tiempoPeque > 55) {
            this.movPeque = true;
        }
    }

    mouseDetenido() {
        return this.mouse.velocidad() === 0;
    }
}

// ---- Pitch detection ---
function startPitch() {
    pitch = ml5.pitchDetection(model_url, audioContext , mic.stream, modelLoaded);
  }
  
  function modelLoaded() {
    getPitch();
  }
  
  function getPitch() {
    pitch.getPitch(function(err, frequency) {
      if (frequency) {
  
        gestorPitch.actualizar(frequency);    
        //console.log(frequency);
      } 
      getPitch();
    })
  }

