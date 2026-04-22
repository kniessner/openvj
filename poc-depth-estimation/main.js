import * as THREE from 'three';

// ============================================
// WebGPU Depth Estimation POC
// Using Depth Anything V2 via Transformers.js
// ============================================

class DepthEstimationEngine {
  constructor() {
    this.pipeline = null;
    this.isModelLoaded = false;
    this.depthCanvas = null;
    this.depthCtx = null;
    this.lastDepthData = null;
    this.frameCount = 0;
    this.depthFps = 0;
    this.lastFpsTime = performance.now();
  }

  async initialize() {
    try {
      // Check WebGPU support
      if (!navigator.gpu) {
        throw new Error('WebGPU not supported. Use Chrome/Edge with WebGPU enabled.');
      }

      // Dynamically import Transformers.js
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
      
      // Configure for WebGPU
      env.backends.onnx.wasm.proxy = false;
      
      // Load Depth Anything V2 small model (lightweight, fast)
      console.log('Loading Depth Anything V2 model...');
      this.pipeline = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
        device: 'webgpu',
        dtype: 'fp16', // Use half precision for speed
      });
      
      this.isModelLoaded = true;
      console.log('Model loaded successfully!');
      
      // Setup depth map canvas
      this.depthCanvas = document.getElementById('depth-map-preview');
      this.depthCtx = this.depthCanvas.getContext('2d');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize depth estimation:', error);
      throw error;
    }
  }

  async estimateDepth(videoElement) {
    if (!this.isModelLoaded || !this.pipeline) return null;
    
    try {
      // Run depth estimation
      const result = await this.pipeline(videoElement, {
        min_depth: 0,
        max_depth: 255,
      });
      
      // Update depth FPS counter
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsTime >= 1000) {
        this.depthFps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTime = now;
      }
      
      // Store depth data
      this.lastDepthData = result.depth;
      
      // Render depth map preview
      this.renderDepthMap(result.depth);
      
      return result.depth;
    } catch (error) {
      console.error('Depth estimation error:', error);
      return null;
    }
  }

  renderDepthMap(depthData) {
    if (!this.depthCanvas || !this.depthCtx || !depthData) return;
    
    const width = depthData.width;
    const height = depthData.height;
    
    // Resize canvas if needed
    if (this.depthCanvas.width !== width || this.depthCanvas.height !== height) {
      this.depthCanvas.width = width;
      this.depthCanvas.height = height;
    }
    
    // Create ImageData
    const imageData = this.depthCtx.createImageData(width, height);
    const data = imageData.data;
    
    // Get depth values (normalized 0-1)
    const depthValues = depthData.data;
    
    // Convert to grayscale
    for (let i = 0; i < depthValues.length; i++) {
      const value = Math.floor(depthValues[i] * 255);
      const idx = i * 4;
      data[idx] = value;     // R
      data[idx + 1] = value; // G
      data[idx + 2] = value; // B
      data[idx + 3] = 255;   // A
    }
    
    this.depthCtx.putImageData(imageData, 0, 0);
  }

  getDepthFPS() {
    return this.depthFps;
  }
}

// ============================================
// Three.js Voxel Renderer
// ============================================

class VoxelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pointCloud = null;
    this.geometry = null;
    this.material = null;
    
    // Settings
    this.resolutionX = 64;
    this.resolutionY = 48;
    this.extrusionScale = 2.0;
    this.pointSize = 3.0;
    this.colorByDepth = true;
    
    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);
    
    // Camera
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 5);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Create initial point cloud
    this.createPointCloud();
    
    // Handle resize
    window.addEventListener('resize', () => this.onResize());
    
    // Start animation loop
    this.animate();
  }

  createPointCloud() {
    // Remove old point cloud
    if (this.pointCloud) {
      this.scene.remove(this.pointCloud);
      this.geometry.dispose();
      this.material.dispose();
    }
    
    const count = this.resolutionX * this.resolutionY;
    
    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    
    // Position attribute
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // Initialize grid positions
    let i = 0;
    for (let y = 0; y < this.resolutionY; y++) {
      for (let x = 0; x < this.resolutionX; x++) {
        // Normalize to -1 to 1 range
        const u = (x / (this.resolutionX - 1)) * 2 - 1;
        const v = (y / (this.resolutionY - 1)) * 2 - 1;
        
        positions[i * 3] = u * 2;     // x
        positions[i * 3 + 1] = -v * 1.5; // y (flip)
        positions[i * 3 + 2] = 0;     // z (depth)
        
        // Default white color
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
        
        i++;
      }
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create shader material for better control
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uPointSize: { value: this.pointSize },
        uTime: { value: 0 }
      },
      vertexShader: `
        uniform float uPointSize;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Circular point
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          
          // Soft edge
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.pointCloud = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.pointCloud);
    
    // Add subtle rotation
    this.pointCloud.rotation.z = Math.PI;
  }

  updateFromDepthMap(depthData) {
    if (!depthData || !this.geometry) return;
    
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;
    
    const depthWidth = depthData.width;
    const depthHeight = depthData.height;
    const depthValues = depthData.data;
    
    let i = 0;
    for (let y = 0; y < this.resolutionY; y++) {
      for (let x = 0; x < this.resolutionX; x++) {
        // Sample from depth map (with bilinear interpolation)
        const depthX = Math.floor((x / this.resolutionX) * depthWidth);
        const depthY = Math.floor((y / this.resolutionY) * depthHeight);
        const depthIdx = depthY * depthWidth + depthX;
        
        const depthValue = depthValues[depthIdx] || 0;
        
        // Update Z position based on depth
        positions[i * 3 + 2] = depthValue * this.extrusionScale;
        
        // Update color based on depth
        if (this.colorByDepth) {
          // Color gradient: near = cyan/blue, far = purple/pink
          const t = depthValue;
          colors[i * 3] = 0.2 + t * 0.8;     // R
          colors[i * 3 + 1] = 0.5 + t * 0.5; // G
          colors[i * 3 + 2] = 0.9;           // B
        } else {
          colors[i * 3] = 1;
          colors[i * 3 + 1] = 1;
          colors[i * 3 + 2] = 1;
        }
        
        i++;
      }
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  setResolution(width, height) {
    this.resolutionX = width;
    this.resolutionY = height;
    this.createPointCloud();
  }

  setExtrusion(scale) {
    this.extrusionScale = scale;
  }

  setPointSize(size) {
    this.pointSize = size;
    if (this.material) {
      this.material.uniforms.uPointSize.value = size;
    }
  }

  setColorByDepth(enabled) {
    this.colorByDepth = enabled;
  }

  getVoxelCount() {
    return this.resolutionX * this.resolutionY;
  }

  onResize() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Slowly rotate
    if (this.pointCloud) {
      this.pointCloud.rotation.y += 0.002;
    }
    
    // Update time uniform
    if (this.material) {
      this.material.uniforms.uTime.value = performance.now() * 0.001;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================
// Main Application
// ============================================

class DepthApp {
  constructor() {
    this.depthEngine = new DepthEstimationEngine();
    this.voxelRenderer = null;
    this.videoElement = null;
    this.isRunning = false;
    this.processingInterval = null;
    this.fps = 0;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    
    this.initUI();
  }

  initUI() {
    // Get elements
    this.startBtn = document.getElementById('start-btn');
    this.videoElement = document.getElementById('webcam-video');
    this.loadingScreen = document.getElementById('loading');
    this.errorContainer = document.getElementById('error-container');
    
    // Controls
    this.resSlider = document.getElementById('resolution');
    this.resValue = document.getElementById('res-value');
    this.extrusionSlider = document.getElementById('extrusion');
    this.extrusionValue = document.getElementById('extrusion-value');
    this.pointSizeSlider = document.getElementById('pointsize');
    this.pointSizeValue = document.getElementById('pointsize-value');
    this.colorModeSlider = document.getElementById('colormode');
    this.colorModeValue = document.getElementById('colormode-value');
    
    // Stats
    this.voxelCountEl = document.getElementById('voxel-count');
    this.fpsEl = document.getElementById('fps-counter');
    this.depthFpsEl = document.getElementById('depth-fps');
    
    // Bind events
    this.startBtn.addEventListener('click', () => this.toggleCamera());
    
    this.resSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const height = Math.round(value * 0.75);
      this.resValue.textContent = `${value}x${height}`;
      if (this.voxelRenderer) {
        this.voxelRenderer.setResolution(value, height);
        this.updateVoxelCount();
      }
    });
    
    this.extrusionSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.extrusionValue.textContent = value.toFixed(1);
      if (this.voxelRenderer) {
        this.voxelRenderer.setExtrusion(value);
      }
    });
    
    this.pointSizeSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.pointSizeValue.textContent = value.toFixed(1);
      if (this.voxelRenderer) {
        this.voxelRenderer.setPointSize(value);
      }
    });
    
    this.colorModeSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.colorModeValue.textContent = value === 1 ? 'On' : 'Off';
      if (this.voxelRenderer) {
        this.voxelRenderer.setColorByDepth(value === 1);
      }
    });
  }

  async init() {
    try {
      // Initialize depth engine
      await this.depthEngine.initialize();
      
      // Initialize Three.js renderer
      const canvas = document.getElementById('depth-canvas');
      this.voxelRenderer = new VoxelRenderer(canvas);
      
      // Update initial voxel count
      this.updateVoxelCount();
      
      // Hide loading screen
      this.loadingScreen.style.display = 'none';
      
      // Start FPS counter
      this.updateFPS();
      
    } catch (error) {
      this.showError(error.message);
      this.loadingScreen.style.display = 'none';
    }
  }

  async toggleCamera() {
    if (this.isRunning) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera() {
    try {
      // Get webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      this.videoElement.srcObject = stream;
      await this.videoElement.play();
      
      this.isRunning = true;
      this.startBtn.textContent = 'Stop Camera';
      
      // Start depth processing loop
      this.processLoop();
      
    } catch (error) {
      this.showError('Camera access denied or not available: ' + error.message);
    }
  }

  stopCamera() {
    this.isRunning = false;
    
    // Stop video stream
    const stream = this.videoElement.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    this.videoElement.srcObject = null;
    
    this.startBtn.textContent = 'Start Camera';
  }

  async processLoop() {
    if (!this.isRunning) return;
    
    const startTime = performance.now();
    
    // Process depth
    if (this.videoElement.readyState >= 2) {
      const depthData = await this.depthEngine.estimateDepth(this.videoElement);
      if (depthData && this.voxelRenderer) {
        this.voxelRenderer.updateFromDepthMap(depthData);
      }
    }
    
    // Update FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
    
    // Update depth FPS
    if (this.depthFpsEl) {
      this.depthFpsEl.textContent = this.depthEngine.getDepthFPS();
    }
    
    // Schedule next frame (throttle to ~15 FPS for depth to save performance)
    setTimeout(() => this.processLoop(), 66);
  }

  updateFPS() {
    if (this.fpsEl) {
      this.fpsEl.textContent = this.fps;
    }
    requestAnimationFrame(() => this.updateFPS());
  }

  updateVoxelCount() {
    if (this.voxelRenderer && this.voxelCountEl) {
      const count = this.voxelRenderer.getVoxelCount();
      this.voxelCountEl.textContent = count >= 1000 ? (count / 1000).toFixed(1) + 'K' : count;
    }
  }

  showError(message) {
    this.errorContainer.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Start the app
const app = new DepthApp();
app.init();
