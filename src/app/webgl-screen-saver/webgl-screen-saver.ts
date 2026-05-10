import {Component, ElementRef, HostListener, viewChild} from '@angular/core';
import * as THREE from 'three';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';

@Component({
  selector: 'app-webgl-screen-saver',
  imports: [],
  templateUrl: './webgl-screen-saver.html',
  styleUrl: './webgl-screen-saver.scss',
})
export class WebglScreenSaver {
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private textMesh!: THREE.Mesh;
  private animationId!: number;

  private velocityX = 0.015;
  private velocityY = 0.01;
  private rotationSpeed = 0.01;

  // Granice ekrana (zavise od pozicije kamere, 4 i 2 su ok za camera.position.z = 5)
  private LIMIT_X = 4;
  private LIMIT_Y = 2.2;

  @HostListener('window:resize')
  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Ažuriraj kameru
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // 2. Ažuriraj renderer
    this.renderer.setSize(width, height);

    // 3. Opciono: Postavi pixel ratio (za oštrinu)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Ažuriraj granice za bounce (da se tekst ne bi odbijao "u prazno")
    this.updateLimits(width, height);
  }

  private updateLimits(width: number, height: number) {
    // Prilagođavamo limite u odnosu na proporciju ekrana
    // Za kameru na z=5, ove vrednosti su dobra polazna tačka:
    const aspect = width / height;
    this.LIMIT_X = 2.5 * aspect;
    this.LIMIT_Y = 2.5;
  }

  async ngOnInit() {
    this.initThree();
    await this.loadText();
    this.animate();
  }

  private initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Crna pozadina kao u originalu

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas().nativeElement, antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Dodajemo svetlo da bi 3D tekst bio vidljiv
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 2);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0x404040));
  }

  private handleBounce(axis: 'x' | 'y') {
    // 1. Obrni osnovni smer
    if (axis === 'x') {
      this.velocityX *= -1;
      // Dodaj malu nasumičnu promenu brzine (-0.005 do +0.005)
      this.velocityX += (Math.random() - 0.5) * 0.01;
    } else {
      this.velocityY *= -1;
      this.velocityY += (Math.random() - 0.5) * 0.01;
    }

    // 2. Ograniči brzinu (da ne stane i da ne ode prebrzo)
    const minSpeed = 0.01;
    const maxSpeed = 0.04;

    this.velocityX = Math.max(minSpeed, Math.min(maxSpeed, Math.abs(this.velocityX))) * Math.sign(this.velocityX);
    this.velocityY = Math.max(minSpeed, Math.min(maxSpeed, Math.abs(this.velocityY))) * Math.sign(this.velocityY);

    // 3. Promeni boju i rotaciju radi efekta
    this.changeColor();
    this.rotationSpeed = 0.005 + Math.random() * 0.02;
  }


  private async loadText() {
    const loader = new FontLoader();

    try {
      // 1. Učitaj tvoj konvertovani font
      // Dodaj /fonts u putanju
      const font = await loader.loadAsync('assets/fonts/futura-cyrillic-extra-bold-regular.json');


      // 2. Kreiraj geometriju sa tvojim tekstom
      const geometry = new TextGeometry('OGILENKO', {
        font: font,
        size: 0.8,          // Malo smanji veličinu jer je Futura "težak" font
        depth: 0.5,         // Dubina za onaj pravi 3D izgled
        curveSegments: 20,  // Više segmenata za oblije ivice Future
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.03,
        bevelOffset: 0,
        bevelSegments: 5
      });

      geometry.center();

      // 3. Materijal - promerni boju u neku "vibrant" retro boju
      const material = new THREE.MeshPhongMaterial({
        color: 0xff0055,    // Jaka pink/crvena
        specular: 0xffffff, // Sjaj na ivicama
        shininess: 100
      });

      if (this.textMesh) this.scene.remove(this.textMesh);

      this.textMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.textMesh);
    } catch (error) {
      console.error('Problem sa tvojim JSON fontom:', error);
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    if (this.textMesh) {
      this.textMesh.rotation.y += this.rotationSpeed;
      this.textMesh.rotation.x += this.rotationSpeed * 0.5;

      this.textMesh.position.x += this.velocityX;
      this.textMesh.position.y += this.velocityY;

      // Provera ivica sa novom logikom
      if (Math.abs(this.textMesh.position.x) > this.LIMIT_X) {
        this.handleBounce('x');
        // "Poguraj" tekst nazad u granice da ne bi ostao zaglavljen u ivici
        this.textMesh.position.x = Math.sign(this.textMesh.position.x) * this.LIMIT_X;
      }

      if (Math.abs(this.textMesh.position.y) > this.LIMIT_Y) {
        this.handleBounce('y');
        this.textMesh.position.y = Math.sign(this.textMesh.position.y) * this.LIMIT_Y;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };


// Pomoćna funkcija za promenu boje kao na starim sistemima
  private changeColor() {
    if (this.textMesh.material instanceof THREE.MeshPhongMaterial) {
      this.textMesh.material.color.setHex(Math.random() * 0xffffff);
    }
  }


  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
  }
}
