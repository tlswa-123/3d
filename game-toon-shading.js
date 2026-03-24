// 🎨 三渲二风格的飞船躲避游戏
// Cel Shading / Toon Shading 实现

let scene, camera, renderer;
let spaceship;
let obstacles = [];
let bullets = [];
let particles = []; // 粒子系统
let score = 0;
let health = 3;
let gameRunning = false;
let animationId;
let lastTime = 0;
let obstacleSpawnRate = 2000;
let lastSpawnTime = 0;
let lastShootTime = 0;
const shootCooldown = 200; // 射击冷却时间（毫秒）

// 飞船控制变量
const keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

let mouseX = 0;
let mouseY = 0;
let useMouseControl = false;

// 飞船移动速度
const spaceshipSpeed = 0.15;

// 初始化游戏
function init() {
    // 创建场景 - 使用渐变背景
    scene = new THREE.Scene();
    scene.background = createToonBackground();

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    // 创建渲染器 - 开启抗锯齿
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 添加卡通风格光源
    addToonLights();

    // 创建卡通风格飞船
    createToonSpaceship();

    // 创建卡通风格星空背景
    createToonStarfield();

    // 添加事件监听器
    addEventListeners();

    // 开始渲染循环
    animate(0);
}

// 创建三渲二渐变背景（模拟动漫天空）
function createToonBackground() {
    // 使用 Canvas 创建渐变背景
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d');

    // 创建深蓝到浅紫的渐变（动漫天空）
    const gradient = ctx.createLinearGradient(0, 0, 0, 2);
    gradient.addColorStop(0, '#0a0a2e'); // 深蓝
    gradient.addColorStop(0.5, '#1a1a4e'); // 中蓝
    gradient.addColorStop(1, '#2a2a6e'); // 浅蓝紫

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    return new THREE.Color(0x1a1a4e);
}

// 添加卡通风格光源
function addToonLights() {
    // 环境光 - 较暗，强调明暗对比
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // 主方向光 - 强烈的定向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 背光 - 增加轮廓感
    const backLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    backLight.position.set(-5, 5, -5);
    scene.add(backLight);
}

// 🚀 创建卡通风格飞船（三渲二）
function createToonSpaceship() {
    const spaceshipGroup = new THREE.Group();

    // 三渲二材质
    const toonMaterialBody = new THREE.MeshToonMaterial({
        color: 0x00aaff,
        gradientMap: createGradientMap()
    });

    const toonMaterialWing = new THREE.MeshToonMaterial({
        color: 0x0066cc,
        gradientMap: createGradientMap()
    });

    const toonMaterialEngine = new THREE.MeshToonMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.9,
        gradientMap: createGradientMap()
    });

    // 1. 机身 - 使用更平滑的几何体
    const bodyGeometry = new THREE.ConeGeometry(0.3, 1.2, 16);
    const body = new THREE.Mesh(bodyGeometry, toonMaterialBody);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    spaceshipGroup.add(body);

    // 2. 驾驶舱 - 使用球形
    const cockpitGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const cockpitMaterial = new THREE.MeshToonMaterial({
        color: 0x88ffff,
        transparent: true,
        opacity: 0.8,
        gradientMap: createGradientMap()
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.15, -0.3);
    cockpit.castShadow = true;
    spaceshipGroup.add(cockpit);

    // 3. 主机翼 - 更大更平整
    const wingGeometry = new THREE.BoxGeometry(2.2, 0.15, 0.8);
    const wing = new THREE.Mesh(wingGeometry, toonMaterialWing);
    wing.position.z = 0.2;
    wing.castShadow = true;
    spaceshipGroup.add(wing);

    // 4. 副翼 - 倾斜的长方体
    const subwingGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.5);
    const leftWing = new THREE.Mesh(subwingGeometry, toonMaterialWing);
    leftWing.position.set(-0.6, 0.12, 0);
    leftWing.rotation.z = 0.3;
    leftWing.castShadow = true;
    spaceshipGroup.add(leftWing);

    const rightWing = new THREE.Mesh(subwingGeometry, toonMaterialWing);
    rightWing.position.set(0.6, 0.12, 0);
    rightWing.rotation.z = -0.3;
    rightWing.castShadow = true;
    spaceshipGroup.add(rightWing);

    // 5. 引擎
    const engineGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.4, 16);
    const mainEngine = new THREE.Mesh(engineGeometry, toonMaterialEngine);
    mainEngine.rotation.x = Math.PI / 2;
    mainEngine.position.z = 0.9;
    mainEngine.castShadow = true;
    spaceshipGroup.add(mainEngine);

    const leftEngine = new THREE.Mesh(engineGeometry, toonMaterialEngine);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.rotation.z = 0.3;
    leftEngine.position.set(-0.6, 0.12, 0.7);
    leftEngine.castShadow = true;
    spaceshipGroup.add(leftEngine);

    const rightEngine = new THREE.Mesh(engineGeometry, toonMaterialEngine);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.rotation.z = -0.3;
    rightEngine.position.set(0.6, 0.12, 0.7);
    rightEngine.castShadow = true;
    spaceshipGroup.add(rightEngine);

    // 6. 装饰线条
    const stripeGeometry = new THREE.BoxGeometry(0.08, 0.08, 1.5);
    const stripeMaterial = new THREE.MeshToonMaterial({
        color: 0xffffff,
        gradientMap: createGradientMap()
    });

    const topStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    topStripe.position.y = 0.35;
    topStripe.castShadow = true;
    spaceshipGroup.add(topStripe);

    const bottomStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    bottomStripe.position.y = -0.25;
    bottomStripe.castShadow = true;
    spaceshipGroup.add(bottomStripe);

    spaceship = spaceshipGroup;
    spaceship.position.set(0, 0, 0);
    scene.add(spaceship);
}

// 创建卡通风格星空（大而简洁的星星）
function createToonStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.9
    });

    const starVertices = [];
    const starColors = [];

    // 创建 3000 颗星星（减少数量，让每一颗更明显）
    for (let i = 0; i < 3000; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        starVertices.push(x, y, z);

        // 卡通风格的星星颜色：纯白、淡黄、淡蓝
        const colorType = Math.random();
        let color;
        if (colorType < 0.5) {
            color = new THREE.Color(0xffffff); // 纯白
        } else if (colorType < 0.8) {
            color = new THREE.Color(0xffffcc); // 淡黄
        } else {
            color = new THREE.Color(0xccccff); // 淡蓝
        }
        starColors.push(color.r, color.g, color.b);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    starMaterial.vertexColors = true;

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

// 创建渐变贴图（用于三渲二）
function createGradientMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d');

    // 创建只有 2 个色阶的渐变（更清晰的卡通效果）
    const gradient = ctx.createLinearGradient(0, 0, 0, 2);
    gradient.addColorStop(0, '#ffffff'); // 亮部
    gradient.addColorStop(1, '#404040'); // 暗部

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    return texture;
}

// 创建卡通风格星球/星环/黑洞（三渲二）
function createToonAsteroid() {
    // 随机决定生成什么类型：星球(60%)、带环星球(25%)、黑洞(15%)
    const typeRoll = Math.random();
    let obstacle;

    if (typeRoll < 0.6) {
        obstacle = createPlanet();
    } else if (typeRoll < 0.85) {
        obstacle = createPlanetWithRing();
    } else {
        obstacle = createBlackHole();
    }

    obstacles.push(obstacle);
    scene.add(obstacle);
}

// 创建普通星球
function createPlanet() {
    const planetGroup = new THREE.Group();

    // 随机大小 - 放大2倍
    const radius = (0.4 + Math.random() * 0.8) * 2;

    // 随机颜色
    const colors = [
        0xff6b6b, // 红色星球
        0x4ecdc4, // 青色星球
        0xffe66d, // 黄色星球
        0x95e1d3, // 绿色星球
        0xf38181, // 橙色星球
        0xaa96da, // 紫色星球
        0xfcbad3, // 粉色星球
        0xa8d8ea, // 浅蓝色星球
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // 星球几何体 - 使用IcosahedronGeometry获得更球形的效果
    const planetGeometry = new THREE.IcosahedronGeometry(radius, 2);

    // 三渲二材质
    const planetMaterial = new THREE.MeshToonMaterial({
        color: color,
        flatShading: true,
        gradientMap: createGradientMap()
    });

    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.castShadow = true;

    // 添加星球表面细节（小陨石坑）
    if (Math.random() > 0.5) {
        const craterGeometry = new THREE.SphereGeometry(radius * 0.15, 8, 8);
        const craterMaterial = new THREE.MeshToonMaterial({
            color: 0x333333,
            flatShading: true,
            gradientMap: createGradientMap()
        });

        for (let i = 0; i < 3; i++) {
            const crater = new THREE.Mesh(craterGeometry, craterMaterial);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            crater.position.set(
                radius * 0.85 * Math.sin(phi) * Math.cos(theta),
                radius * 0.85 * Math.sin(phi) * Math.sin(theta),
                radius * 0.85 * Math.cos(phi)
            );
            planetGroup.add(crater);
        }
    }

    planetGroup.add(planet);

    // 随机位置
    planetGroup.position.x = (Math.random() - 0.5) * 15;
    planetGroup.position.y = (Math.random() - 0.5) * 10;
    planetGroup.position.z = -50;

    // 随机旋转速度
    planetGroup.userData = {
        type: 'planet',
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        },
        speed: 0.15 + Math.random() * 0.25,
        radius: radius,
        maxHealth: Math.floor(2 + Math.random() * 3), // 2-4次射击
        health: 0
    };

    return planetGroup;
}

// 创建带星环的星球
function createPlanetWithRing() {
    const planetGroup = new THREE.Group();

    // 星球本体（比普通星球稍大） - 放大2倍
    const radius = (0.5 + Math.random() * 0.7) * 2;

    // 随机颜色
    const colors = [
        0xff8c42, // 橙色
        0x6fcf97, // 绿色
        0x2d9cdb, // 蓝色
        0xeb5757, // 红色
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // 星球几何体
    const planetGeometry = new THREE.IcosahedronGeometry(radius, 2);

    // 三渲二材质
    const planetMaterial = new THREE.MeshToonMaterial({
        color: color,
        flatShading: true,
        gradientMap: createGradientMap()
    });

    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.castShadow = true;
    planetGroup.add(planet);

    // 创建星环
    const ringInnerRadius = radius * 1.4;
    const ringOuterRadius = radius * 2.2;
    const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64);

    // 星环材质 - 半透明
    const ringColor = new THREE.Color(color);
    ringColor.multiplyScalar(0.7); // 星环比星球稍暗

    const ringMaterial = new THREE.MeshToonMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        flatShading: true,
        gradientMap: createGradientMap()
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = (Math.random() - 0.5) * 0.3; // 稍微倾斜
    ring.castShadow = true;
    planetGroup.add(ring);

    // 添加第二个星环（更细的）
    if (Math.random() > 0.5) {
        const innerRingGeometry = new THREE.RingGeometry(radius * 1.8, radius * 2.0, 64);
        const innerRingMaterial = new THREE.MeshToonMaterial({
            color: ringColor,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            flatShading: true,
            gradientMap: createGradientMap()
        });
        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        innerRing.rotation.x = Math.PI / 2;
        innerRing.rotation.y = ring.rotation.y + 0.1;
        planetGroup.add(innerRing);
    }

    // 随机位置
    planetGroup.position.x = (Math.random() - 0.5) * 15;
    planetGroup.position.y = (Math.random() - 0.5) * 10;
    planetGroup.position.z = -50;

    // 随机旋转速度（星环星球旋转更慢）
    planetGroup.userData = {
        type: 'ringedPlanet',
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.01,
            z: (Math.random() - 0.5) * 0.01
        },
        speed: 0.12 + Math.random() * 0.2,
        radius: radius * 2.2, // 用于碰撞检测，考虑星环
        maxHealth: Math.floor(4 + Math.random() * 4), // 4-7次射击（带星环更难）
        health: 0
    };

    return planetGroup;
}

// 创建黑洞
function createBlackHole() {
    const blackHoleGroup = new THREE.Group();

    const radius = (0.5 + Math.random() * 0.4) * 2;

    // 1. 事件视界（黑色核心）
    const eventHorizonGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const eventHorizonMaterial = new THREE.MeshToonMaterial({
        color: 0x000000,
        flatShading: true,
        gradientMap: createGradientMap()
    });
    const eventHorizon = new THREE.Mesh(eventHorizonGeometry, eventHorizonMaterial);
    blackHoleGroup.add(eventHorizon);

    // 2. 吸积盘（发光的环）
    const accretionDiskInner = radius * 1.3;
    const accretionDiskOuter = radius * 2.5;
    const accretionDiskGeometry = new THREE.RingGeometry(accretionDiskInner, accretionDiskOuter, 64);

    // 吸积盘材质 - 使用橙色和红色的渐变
    const accretionDiskMaterial = new THREE.MeshToonMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        flatShading: true,
        gradientMap: createGradientMap()
    });
    const accretionDisk = new THREE.Mesh(accretionDiskGeometry, accretionDiskMaterial);
    accretionDisk.rotation.x = Math.PI / 2;
    accretionDisk.rotation.y = (Math.random() - 0.5) * 0.5;
    blackHoleGroup.add(accretionDisk);

    // 3. 外部光晕（更亮的环）
    const haloGeometry = new THREE.RingGeometry(radius * 2.4, radius * 3.2, 64);
    const haloMaterial = new THREE.MeshToonMaterial({
        color: 0xff9933,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        flatShading: true,
        gradientMap: createGradientMap()
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.rotation.x = Math.PI / 2;
    halo.rotation.y = accretionDisk.rotation.y;
    blackHoleGroup.add(halo);

    // 随机位置
    blackHoleGroup.position.x = (Math.random() - 0.5) * 15;
    blackHoleGroup.position.y = (Math.random() - 0.5) * 10;
    blackHoleGroup.position.z = -50;

    // 黑洞旋转速度较快
    blackHoleGroup.userData = {
        type: 'blackHole',
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.03,
            y: (Math.random() - 0.5) * 0.03,
            z: (Math.random() - 0.5) * 0.03
        },
        speed: 0.18 + Math.random() * 0.3,
        radius: radius * 3.2, // 用于碰撞检测，考虑吸积盘
        maxHealth: Math.floor(6 + Math.random() * 5), // 6-10次射击（黑洞最难）
        health: 0
    };

    return blackHoleGroup;
}

// 创建子弹
function createBullet() {
    const bulletGeometry = new THREE.SphereGeometry(0.15, 8, 8); // 放大炮弹
    const bulletMaterial = new THREE.MeshToonMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        flatShading: true,
        gradientMap: createGradientMap()
    });

    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // 子弹从飞船位置发射
    bullet.position.copy(spaceship.position);
    bullet.position.z -= 0.5; // 从飞船前方发射

    // 子弹朝向
    const direction = new THREE.Vector3(0, 0, -1);
    bullet.userData = {
        direction: direction,
        speed: 0.8
    };

    bullets.push(bullet);
    scene.add(bullet);
}

// 创建爆炸粒子效果（三渲二风格）
function createExplosion(position, color) {
    const particleCount = 15 + Math.random() * 10; // 15-25个粒子

    for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.08); // 使用立方体增强卡通感
        const particleMaterial = new THREE.MeshToonMaterial({
            color: color,
            transparent: true,
            opacity: 1.0,
            flatShading: true,
            gradientMap: createGradientMap()
        });

        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        // 粒子位置
        particle.position.copy(position);
        // 添加一些随机偏移
        particle.position.x += (Math.random() - 0.5) * 0.3;
        particle.position.y += (Math.random() - 0.5) * 0.3;
        particle.position.z += (Math.random() - 0.5) * 0.3;

        // 随机速度方向
        const speed = 0.05 + Math.random() * 0.1;
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();

        particle.userData = {
            velocity: direction.multiplyScalar(speed),
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.3,
                y: (Math.random() - 0.5) * 0.3,
                z: (Math.random() - 0.5) * 0.3
            },
            life: 1.0, // 粒子生命周期
            decayRate: 0.02 + Math.random() * 0.02 // 衰减速度
        };

        particles.push(particle);
        scene.add(particle);
    }
}

// 更新粒子
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // 移动粒子
        particle.position.add(particle.userData.velocity);

        // 旋转粒子
        particle.rotation.x += particle.userData.rotationSpeed.x;
        particle.rotation.y += particle.userData.rotationSpeed.y;
        particle.rotation.z += particle.userData.rotationSpeed.z;

        // 减少粒子生命值
        particle.userData.life -= particle.userData.decayRate;

        // 更新透明度
        particle.material.opacity = particle.userData.life;

        // 移除死亡的粒子
        if (particle.userData.life <= 0) {
            scene.remove(particle);
            particles.splice(i, 1);
        }
    }
}

// 更新子弹
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        // 移动子弹
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed));

        // 移除超出屏幕的子弹
        if (bullet.position.z < -60) {
            scene.remove(bullet);
            bullets.splice(i, 1);
            continue;
        }

        // 检查子弹与障碍物的碰撞
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obstacle = obstacles[j];
            const distance = bullet.position.distanceTo(obstacle.position);

            if (distance < obstacle.userData.radius) {
                // 获取障碍物颜色用于粒子效果
                const obstacleMesh = obstacle.children[0];
                const obstacleColor = obstacleMesh && obstacleMesh.material ?
                    obstacleMesh.material.color : new THREE.Color(0xffffff);

                // 击中障碍物
                obstacle.userData.health++;

                // 创建粒子效果
                createExplosion(bullet.position, obstacleColor);

                // 检查是否摧毁障碍物
                if (obstacle.userData.health >= obstacle.userData.maxHealth) {
                    // 障碍物被摧毁 - 创建更大的爆炸
                    createExplosion(obstacle.position, obstacleColor);
                    createExplosion(obstacle.position, obstacleColor);

                    scene.remove(obstacle);
                    obstacles.splice(j, 1);
                    score += 50; // 摧毁障碍物加分
                    updateScore();
                } else {
                    // 障碍物变暗，显示被击中效果
                    if (obstacleMesh && obstacleMesh.material) {
                        obstacleMesh.material.color.multiplyScalar(0.9);
                    }
                }

                // 移除子弹
                scene.remove(bullet);
                bullets.splice(i, 1);
                break;
            }
        }
    }
}

// 更新飞船位置
function updateSpaceship() {
    if (!gameRunning) return;

    // 键盘控制
    if (!useMouseControl) {
        if (keys.left) spaceship.position.x -= spaceshipSpeed;
        if (keys.right) spaceship.position.x += spaceshipSpeed;
        if (keys.up) spaceship.position.y += spaceshipSpeed;
        if (keys.down) spaceship.position.y -= spaceshipSpeed;
    }
    // 鼠标控制
    else {
        spaceship.position.x += (mouseX - spaceship.position.x) * 0.1;
        spaceship.position.y += (mouseY - spaceship.position.y) * 0.1;
    }

    // 限制飞船移动范围
    spaceship.position.x = Math.max(-7, Math.min(7, spaceship.position.x));
    spaceship.position.y = Math.max(-5, Math.min(5, spaceship.position.y));

    // 飞船倾斜效果
    spaceship.rotation.z = -spaceship.position.x * 0.1;
}

// 更新障碍物
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];

        // 移动障碍物
        obstacle.position.z += obstacle.userData.speed;

        // 旋转障碍物
        obstacle.rotation.x += obstacle.userData.rotationSpeed.x;
        obstacle.rotation.y += obstacle.userData.rotationSpeed.y;
        obstacle.rotation.z += obstacle.userData.rotationSpeed.z;

        // 移除超出屏幕的障碍物（没有被摧毁的）
        if (obstacle.position.z > 10) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
            score += 5; // 避开障碍物加分较少
            updateScore();

            // 随着分数增加，增加难度
            if (score % 100 === 0 && obstacleSpawnRate > 500) {
                obstacleSpawnRate -= 100;
            }
        }

        // 碰撞检测
        if (checkCollision(spaceship, obstacle)) {
            health--;
            updateHealth();

            // 移除碰撞的障碍物
            scene.remove(obstacle);
            obstacles.splice(i, 1);

            // 检查游戏结束
            if (health <= 0) {
                gameOver();
            }
        }
    }
}

// 碰撞检测
function checkCollision(obj1, obj2) {
    const distance = obj1.position.distanceTo(obj2.position);
    return distance < 1.0;
}

// 更新分数显示
function updateScore() {
    document.getElementById('score').textContent = `分数: ${score}`;
}

// 更新生命值显示
function updateHealth() {
    const hearts = '❤️'.repeat(health);
    document.getElementById('health').textContent = `生命: ${hearts}`;
}

// 生成障碍物
function spawnObstacle(currentTime) {
    if (currentTime - lastSpawnTime > obstacleSpawnRate) {
        createToonAsteroid();
        lastSpawnTime = currentTime;
    }
}

// 游戏循环
function animate(currentTime) {
    animationId = requestAnimationFrame(animate);

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    if (gameRunning) {
        updateSpaceship();
        updateBullets();
        updateParticles();
        updateObstacles();
        spawnObstacle(currentTime);

        if (Math.floor(currentTime / 1000) > Math.floor((currentTime - deltaTime) / 1000)) {
            score++;
            updateScore();
        }
    }

    renderer.render(scene, camera);
}

// 添加事件监听器
function addEventListeners() {
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 'w': case 'arrowup': keys.up = true; break;
            case 's': case 'arrowdown': keys.down = true; break;
            case 'a': case 'arrowleft': keys.left = true; break;
            case 'd': case 'arrowright': keys.right = true; break;
            case ' ':
                // 空格键射击
                if (gameRunning && Date.now() - lastShootTime >= shootCooldown) {
                    createBullet();
                    lastShootTime = Date.now();
                }
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key.toLowerCase()) {
            case 'w': case 'arrowup': keys.up = false; break;
            case 's': case 'arrowdown': keys.down = false; break;
            case 'a': case 'arrowleft': keys.left = false; break;
            case 'd': case 'arrowright': keys.right = false; break;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (gameRunning) {
            useMouseControl = true;
            mouseX = (e.clientX / window.innerWidth) * 14 - 7;
            mouseY = -(e.clientY / window.innerHeight) * 10 + 5;
        }
    });

    // 鼠标点击射击
    document.addEventListener('mousedown', (e) => {
        if (gameRunning && Date.now() - lastShootTime >= shootCooldown) {
            createBullet();
            lastShootTime = Date.now();
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
}

// 开始游戏
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    gameRunning = true;
    score = 0;
    health = 3;
    updateScore();
    updateHealth();
}

// 重新开始游戏
function restartGame() {
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];
    bullets.forEach(bullet => scene.remove(bullet));
    bullets = [];
    particles.forEach(particle => scene.remove(particle));
    particles = [];
    spaceship.position.set(0, 0, 0);
    spaceship.rotation.set(0, 0, 0);
    document.getElementById('gameOverScreen').style.display = 'none';
    startGame();
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = `最终分数: ${score}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// 初始化游戏
init();
