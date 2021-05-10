var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function () {
  return new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
  });
};

var inputMap = {};

var advancedTexture;
var score;

var barrelsAreas = new Map();
var collectablesAreas = new Map();

var barrelSound;
var collectableSound;

var gameWon = false;
var collectableColected = 0;

const collectablePosition = [
  { x: 60, z: 0 },
  { x: 0, z: -60 },
  { x: -30, z: 5 },
  { x: -5, z: -30 },
  { x: 35, z: -14 },
  { x: 14, z: -27 },
  { x: 9, z: 49 },
  { x: -49, z: -9 },
  { x: -33.3, z: 24.7 },
  { x: 24.7, z: -33.3 },
];

const meshesArray = [
  { fileName: "aerobatic_plane.glb", scale: 30, posY: 5 },
  { fileName: "Georgia-Tech-Dragon/dragon.babylon", scale: 50, posY: 0 },
  { fileName: "shark.glb", scale: 1, posY: -2 },
  { fileName: "seagulf.glb", scale: 0.006, posY: 3.15 },
  { fileName: "ExplodingBarrel.glb", scale: 0.025, posY: 0 },
  { fileName: "emoji_heart.glb", scale: 60, posY: 0 },
];

var createScene = function () {
  engine.enableOfflineSupport = false;
  scene = new BABYLON.Scene(engine);

  camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2.5,
    15,
    new BABYLON.Vector3(0, 0, 0)
  );
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(1, 1, 0)
  );

  createProject(scene, camera);

  return scene;
};

function createProject(scene, camera) {
  scene.collisionEnabled = true;
  //scene.debugLayer.show();

  advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  informationsPanel();
  scorePanel();
  showInstructions();

  createSkybox();
  createGround();
  createAreaLimit();

  const player = new Player(scene, camera, actionManager());

  importElements("meshes");
  importElements("barrels");
  importCollectables();

  barrelSound = new BABYLON.Sound(
    "barrelSound",
    "./sounds/explosion.wav",
    scene,
    null,
    {
      loop: false,
      autoplay: false,
    }
  );

  collectableSound = new BABYLON.Sound(
    "collectableSound",
    "./sounds/hey-ye-yaa.wav",
    scene,
    null,
    {
      loop: false,
      autoplay: false,
    }
  );
}

function actionManager() {
  scene.actionManager = new BABYLON.ActionManager(scene);
  scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger,
      function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
      }
    )
  );

  scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyUpTrigger,
      function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
      }
    )
  );

  return inputMap;
}

function informationsPanel() {
  var informationsPanel = new BABYLON.GUI.Rectangle();
  informationsPanel.width = 0.245;
  informationsPanel.height = "225px";
  informationsPanel.cornerRadius = 5;
  informationsPanel.thickness = 4;
  informationsPanel.background = "black";

  informationsPanel.horizontalAlignment =
    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  informationsPanel.verticalAlignment =
    BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

  informationsPanel.alpha = 0.7;

  var informations = new BABYLON.GUI.TextBlock();
  informations.text =
    "Projeto AC2 - Computação Gráfica II" +
    "\n\nSérgio Vicente T. - 183263" +
    "\n\nControles:" +
    "\n\nW e S para andar\nA e D para direcionar\nB para dançar" +
    "\n1, 2 ou 3 para mudar a velocidade";
  informations.color = "white";
  informationsPanel.addControl(informations);
  advancedTexture.addControl(informationsPanel);
}

function scorePanel() {
  var scorePanel = new BABYLON.GUI.Rectangle();
  scorePanel.width = 0.15;
  scorePanel.height = "90px";
  scorePanel.cornerRadius = 5;
  scorePanel.thickness = 4;
  scorePanel.background = "black";

  scorePanel.horizontalAlignment =
    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  scorePanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

  scorePanel.alpha = 0.7;

  score = new BABYLON.GUI.TextBlock();
  score.text = "Corações coletados\n\n" + collectableColected;
  score.fontSize = 20;
  score.color = "white";

  scorePanel.addControl(score);
  advancedTexture.addControl(scorePanel);
}

function showInstructions() {
  var instructions = new BABYLON.GUI.TextBlock();
  instructions.text = "Colete 10 corações, começando do maior para o menor";
  instructions.fontSize = 24;
  instructions.top = -100;
  instructions.color = "white";
  advancedTexture.addControl(instructions);

  setTimeout(function () {
    advancedTexture.removeControl(instructions);
  }, 6000);
}

function showGameOver() {
  var finalMessage = new BABYLON.GUI.TextBlock();
  finalMessage.text = "Fim de jogo";
  finalMessage.fontSize = 24;
  finalMessage.top = -150;
  finalMessage.color = "white";
  advancedTexture.addControl(finalMessage);
}

function createSkybox() {
  var skybox = BABYLON.MeshBuilder.CreateSphere(
    "skyBox",
    { diameter: 200, sideOrientation: 1 },
    scene
  );
  var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
    "textures/skybox4",
    scene
  );
  skyboxMaterial.reflectionTexture.coordinatesMode =
    BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skybox.material = skyboxMaterial;
}

function createGround() {
  const groundMaterial = new BABYLON.StandardMaterial("groundMaterial");
  groundMaterial.diffuseTexture = new BABYLON.Texture("textures/snow.jfif");

  const largeGround = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "largeGround",
    "heightmaps/01.png",
    {
      width: 200,
      height: 200,
      subdivisions: 30,
      minHeight: 0,
      maxHeight: 12,
      sideOrientation: 0,
    }
  );
  groundMaterial.diffuseTexture.uScale = 10;
  groundMaterial.diffuseTexture.vScale = 10;
  largeGround.material = groundMaterial;
}

function createAreaLimit() {
  const cylinder = BABYLON.MeshBuilder.CreateCylinder("areaLimit", {
    height: 5,
    diameter: 140,
    sideOrientation: 1,
  });
  cylinder.visibility = 0;
  cylinder.checkCollisions = true;
}

function importBabylonMesh(mesh, meshName, posX, posZ, scale) {
  BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "https://models.babylonjs.com/",
    mesh.fileName,
    scene
  ).then((result) => {
    const importedMesh = result.meshes[0];
    importedMesh.name = meshName;
    importedMesh.position.x = posX;
    importedMesh.position.y = mesh.posY;
    importedMesh.position.z = posZ;
    importedMesh.scaling.scaleInPlace(scale);
  });
}

function importElements(element) {
  var quantity = element == "meshes" ? 4 : 7;
  var radius = element == "meshes" ? 60 : 30;
  var incAngle = Math.PI / (quantity / 2);
  var angle = 0;

  for (var i = 0; i < quantity; i++) {
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    angle = angle + incAngle;

    if (element == "meshes")
      importBabylonMesh(meshesArray[i], "mesh" + i, x, z, meshesArray[i].scale);
    else {
      importBabylonMesh(
        meshesArray[4],
        "barrel" + i,
        x,
        z,
        meshesArray[4].scale
      );

      const torus = BABYLON.MeshBuilder.CreateTorus("torus", {
        thickness: 0.05,
        diameter: 1.15,
        sideOrientation: 1,
      });
      torus.position.x = x;
      torus.position.z = z;
      torus.visibility = false;

      barrelsAreas.set("barrelArea" + i, torus);
    }
  }
}

function importCollectables() {
  var scale = 4;
  for (i = 0; i < 10; i++) {
    importBabylonMesh(
      meshesArray[5],
      "collectable" + i,
      collectablePosition[i].x,
      collectablePosition[i].z,
      meshesArray[5].scale - scale
    );

    scale += 4;

    const torus = BABYLON.MeshBuilder.CreateTorus("torus", {
      thickness: 0.2,
      diameter: 1.15,
      sideOrientation: 1,
    });
    torus.position.x = collectablePosition[i].x;
    torus.position.y = 0;
    torus.position.z = collectablePosition[i].z;
    torus.visibility = false;

    collectablesAreas.set("collectableArea" + i, torus);
  }
}

function startParticleOnObject(object) {
  const particleSystem = new BABYLON.ParticleSystem("flareParticle", 1000);
  particleSystem.particleTexture = new BABYLON.Texture("./particles/fire.png");

  particleSystem.minSize = 0.05;
  particleSystem.maxSize = 0.2;

  particleSystem.targetStopDuration = 1.25;

  particleSystem.color1 = new BABYLON.Color4(1, 0, 0, 0);

  particleSystem.emitRate = 100;

  particleSystem.emitter = new BABYLON.Vector3(
    object.position.x,
    object.position.y + 0.1,
    object.position.z
  );

  particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
  particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 3, 0.5);

  particleSystem.start();
}

function applyAnimationOnObject(object) {
  var yElevation = new BABYLON.Animation(
    "yElevation",
    "position.y",
    100,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  ); /* Criação da animação de rotação das teclas no eixo X */
  let keyFrames = []; /* Array para os estados da animação */

  keyFrames.push({
    frame: 0,
    value: -1,
  });

  keyFrames.push({
    frame: 5,
    value: -0.5,
  });

  keyFrames.push({
    frame: 10,
    value: 0.5,
  });

  keyFrames.push({
    frame: 15,
    value: 0,
  });

  keyFrames.push({
    frame: 20,
    value: 0.5,
  });

  keyFrames.push({
    frame: 25,
    value: 1,
  });

  yElevation.setKeys(keyFrames);

  scene.beginDirectAnimation(object, [yElevation], 0, 25, true);
}

function checkInstersection() {
  setTimeout(function () {
    var player = scene.getMeshByName("player");
    var barrelCont = 0;
    var collectableCont = 0;

    barrelsAreas.forEach(function (area) {
      if (area.intersectsMesh(player, true)) {
        var barrel = scene.getMeshByName("barrel" + barrelCont);

        if (barrel != null) {
          startParticleOnObject(barrel);

          setTimeout(function () {
            barrel.dispose();
            barrelSound.play();
          }, 3000);
        }
      }
      barrelCont++;
    });

    collectablesAreas.forEach(function (area) {
      if (area.intersectsMesh(player, true)) {
        if (collectableCont == collectableColected) {
          var collectable = scene.getMeshByName(
            "collectable" + collectableCont
          );

          if (collectable != null) {
            applyAnimationOnObject(collectable);
            setTimeout(function () {
              score.text = "Corações coletados\n\n" + collectableColected;
              collectable.dispose();
              collectableSound.play();
            }, 500);
            collectableColected++;

            if (collectableColected == 10) {
              gameWon = true;
              collectableColected = 0;
            }
          }
        }
      }
      collectableCont++;
    });
  }, 4000);
}

function restartGame() {
  var btnRestart = BABYLON.GUI.Button.CreateSimpleButton(
    "btnRestart",
    "RESTART"
  );
  btnRestart.width = 0.1;
  btnRestart.height = "40px";
  btnRestart.color = "white";
  btnRestart.background = "black";
  btnRestart.horizontalAlignment =
    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  btnRestart.top = -50;
  advancedTexture.addControl(btnRestart);

  btnRestart.onPointerClickObservable.add(function () {
    location.reload();
  });

  showGameOver();

  inputMap["b"] = "keydown";
  const sambaAnim = scene.getAnimationGroupByName("Samba");
  sambaAnim.start(true, 1.0, sambaAnim.from, sambaAnim.to, false);
}

var engine;
var scene;
initFunction = async function () {
  var asyncEngineCreation = async function () {
    try {
      return createDefaultEngine();
    } catch (e) {
      console.log(
        "the available createEngine function failed. Creating the default engine instead"
      );
      return createDefaultEngine();
    }
  };

  engine = await asyncEngineCreation();
  if (!engine) throw "engine should not be null.";
  scene = createScene();
};
initFunction().then(() => {
  sceneToRender = scene;
  engine.runRenderLoop(function () {
    if (sceneToRender && sceneToRender.activeCamera) {
      if (gameWon) {
        restartGame();
        gameWon = false;
      }
      checkInstersection();
      sceneToRender.render();
    }
  });
});

// Resize
window.addEventListener("resize", function () {
  engine.resize();
});

class Player {
  constructor(scene, camera, inputMap) {
    BABYLON.SceneLoader.ImportMesh(
      "",
      "https://assets.babylonjs.com/meshes/",
      "HVGirl.glb",
      scene,
      function (meshes) {
        var hero = meshes[0];

        hero.name = "player";

        hero.scaling.scaleInPlace(0.1);

        camera.target = hero;

        var heroSpeed = 0.1;
        var heroSpeedBackwards = 0.01;
        var heroRotationSpeed = 0.05;

        var animating = true;

        const walkAnim = scene.getAnimationGroupByName("Walking");
        const walkBackAnim = scene.getAnimationGroupByName("WalkingBack");
        const idleAnim = scene.getAnimationGroupByName("Idle");
        const sambaAnim = scene.getAnimationGroupByName("Samba");

        scene.onBeforeRenderObservable.add(() => {
          var keydown = false;

          if (inputMap["w"]) {
            hero.moveWithCollisions(hero.forward.scaleInPlace(heroSpeed));
            keydown = true;
          }
          if (inputMap["s"]) {
            hero.moveWithCollisions(
              hero.forward.scaleInPlace(-heroSpeedBackwards)
            );
            keydown = true;
          }
          if (inputMap["a"]) {
            hero.rotate(BABYLON.Vector3.Up(), -heroRotationSpeed);
            keydown = true;
          }
          if (inputMap["d"]) {
            hero.rotate(BABYLON.Vector3.Up(), heroRotationSpeed);
            keydown = true;
          }
          if (inputMap["b"]) {
            keydown = true;
          }
          if (inputMap["+"]) {
            heroSpeed = 0.1;
            keydown = true;
          }
          if (inputMap["2"]) {
            heroSpeed = 0.15;
            keydown = true;
          }
          if (inputMap["3"]) {
            heroSpeed = 0.2;
            keydown = true;
          }

          if (keydown) {
            if (!animating) {
              animating = true;
              if (inputMap["s"]) {
                walkBackAnim.start(
                  true,
                  1.0,
                  walkBackAnim.from,
                  walkBackAnim.to,
                  false
                );
              } else if (inputMap["b"]) {
                sambaAnim.start(true, 1.0, sambaAnim.from, sambaAnim.to, false);
              } else {
                walkAnim.start(true, 1.0, walkAnim.from, walkAnim.to, false);
              }
            }
          } else {
            if (animating) {
              idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);

              sambaAnim.stop();
              walkAnim.stop();
              walkBackAnim.stop();

              animating = false;
            }
          }
        });
      }
    );
  }
}
