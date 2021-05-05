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

const meshesArray = [
  { fileName: "aerobatic_plane.glb", scale: 30, posY: 5 },
  { fileName: "Georgia-Tech-Dragon/dragon.babylon", scale: 50, posY: 0 },
  { fileName: "Skull/skull.babylon", scale: 0.015, posY: 0.45 },
  { fileName: "toast_acrobatics.glb", scale: 5, posY: 0 },
  { fileName: "shark.glb", scale: 1, posY: -2.5 },
  { fileName: "haunted_house.glb", scale: 60, posY: 0 },
  { fileName: "seagulf.glb", scale: 0.006, posY: 3.15 },
];

var barrels = new Map();
var barrelsPoints = new Map();

var createScene = function () {
  engine.enableOfflineSupport = false;
  scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera(
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
  scene.gravity = new BABYLON.Vector3(0, -0.9, 0);
  //scene.debugLayer.show();

  const player = new Player(scene, camera, actionManager());

  createGUIElements();

  createSkybox();
  createGround();
  createAreaLimit();

  importElements("mesh");
  importElements("barrel");

  triggerExplosion();
}

function actionManager() {
  var inputMap = {};

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

function createGUIElements() {
  var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
    "UI"
  );

  var namesPanel = new BABYLON.GUI.Rectangle();
  namesPanel.width = 0.245;
  namesPanel.height = "225px";
  namesPanel.cornerRadius = 5;
  namesPanel.thickness = 4;
  namesPanel.background = "black";

  namesPanel.horizontalAlignment =
    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  namesPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

  namesPanel.alpha = 0.7;

  var names = new BABYLON.GUI.TextBlock();
  names.text =
    "Projeto AC2 - Computação Gráfica II" +
    "\n\nSérgio Vicente T. - 183263" +
    "\n\nControles:" +
    "\n\nW e S para andar\nA e D para direcionar\nB para dançar" +
    "\n1, 2 ou 3 para mudar a velocidade";
  names.color = "white";
  namesPanel.addControl(names);

  advancedTexture.addControl(namesPanel);
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
  var skybox = BABYLON.MeshBuilder.CreateSphere(
    "skyBox",
    { diameter: 135, sideOrientation: 1 },
    scene
  );
  skybox.visibility = 0;
  skybox.checkCollisions = true;
}

function importBabylonMesh(mesh, posX, posZ) {
  BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "https://models.babylonjs.com/",
    mesh.fileName,
    scene
  ).then((result) => {
    const importedMesh = result.meshes[0];
    importedMesh.position.x = posX;
    importedMesh.position.y = mesh.posY;
    importedMesh.position.z = posZ;
    importedMesh.scaling.scaleInPlace(mesh.scale);
  });
}

function importElements(element) {
  var angle = 0;
  var quantity = element == "mesh" ? 7 : 14;
  var incAngle = Math.PI / (quantity / 2);
  var radius = element == "mesh" ? 60 : 40;

  for (var i = 0; i < quantity; i++) {
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    angle = angle + incAngle;

    if (element == "mesh") importBabylonMesh(meshesArray[i], x, z);
    else {
      var barrel = new ExplodingBarrel("barrel" + i, x, z);
      barrels.set("barrel" + i, barrel);

      var point = [{ x: x, z: z }];
      barrelsPoints.set("barrel" + i, point);
      //console.log(barrelsPoints.get("barrel" + i));
    }
  }
}

function triggerExplosion() {
  scene.meshes.forEach((mesh) => {
    console.log(mesh);
  });
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
      function (newMeshes, particleSystems, skeletons, animationGroups) {
        var hero = newMeshes[0];

        hero.name = "hero";

        hero.scaling.scaleInPlace(0.1);

        camera.target = hero;

        var heroSpeed = 0.06;
        var heroSpeedBackwards = 0.01;
        var heroRotationSpeed = 0.1;

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
            heroSpeed = 0.08;
            keydown = true;
          }
          if (inputMap["2"]) {
            heroSpeed = 0.1;
            keydown = true;
          }
          if (inputMap["3"]) {
            heroSpeed = 0.12;
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

        scene.addMesh(hero);

        //console.log(scene.getMeshByName("hero"));
      }
    );
  }
}

class ExplodingBarrel {
  constructor(barrelName, posX, posZ) {
    BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "https://models.babylonjs.com/",
      "ExplodingBarrel.glb",
      scene
    ).then((result) => {
      const mesh = result.meshes[0];

      mesh.scaling.scaleInPlace(0.025);

      mesh.name = barrelName;

      mesh.position.x = posX;
      mesh.position.z = posZ;
    });
  }
}
