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

var createScene = function () {
  engine.enableOfflineSupport = true;
  scene = new BABYLON.Scene(engine);
  const camera = createCamera();
  createLight();

  createGUIElements();
  createSkybox();
  createGround();

  importBabylonMesh("Skull/skull.babylon", 0, 3, 2, 0.02);

  // Keyboard events
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

  const player = new Player(scene, camera, inputMap);

  return scene;
};

function createCamera() {
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2.5,
    15,
    new BABYLON.Vector3(0, 0, 0)
  );
  camera.attachControl(canvas, true);

  return camera;
}

function createLight() {
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(1, 1, 0)
  );
}

function createSkybox() {
  var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
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

function createGUIElements() {
  // GUI
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

function createGround() {
  const groundMaterial = new BABYLON.StandardMaterial("groundMaterial");
  groundMaterial.diffuseTexture = new BABYLON.Texture("textures/snow.jfif");

  const largeGround = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "largeGround",
    "heightmaps/01.png",
    { width: 200, height: 200, subdivisions: 30, minHeight: 0, maxHeight: 5 }
  );
  groundMaterial.diffuseTexture.uScale = 30;
  groundMaterial.diffuseTexture.vScale = 30;
  largeGround.material = groundMaterial;
}

function importBabylonMesh(filenameDotFormat, posX, posY, posZ, scale) {
  BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "https://models.babylonjs.com/",
    filenameDotFormat,
    scene
  ).then((result) => {
    let mesh = result.meshes[0];
    mesh.position.x = posX;
    mesh.position.y = posY;
    mesh.position.z = posZ;
    mesh.scaling.scaleInPlace(scale);
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
    // Load hero character
    BABYLON.SceneLoader.ImportMesh(
      "",
      "https://assets.babylonjs.com/meshes/",
      "HVGirl.glb",
      scene,
      function (newMeshes, particleSystems, skeletons, animationGroups) {
        var hero = newMeshes[0];

        //Scale the model down
        hero.scaling.scaleInPlace(0.1);

        //Lock camera on the character
        camera.target = hero;

        //Hero character variables
        var heroSpeed = 0.045;
        var heroSpeedBackwards = 0.01;
        var heroRotationSpeed = 0.1;

        var animating = true;

        const walkAnim = scene.getAnimationGroupByName("Walking");
        const walkBackAnim = scene.getAnimationGroupByName("WalkingBack");
        const idleAnim = scene.getAnimationGroupByName("Idle");
        const sambaAnim = scene.getAnimationGroupByName("Samba");

        //Rendering loop (executed for everyframe)
        scene.onBeforeRenderObservable.add(() => {
          var keydown = false;
          //Manage the movements of the character (e.g. position, direction)
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
          if (inputMap["1"]) {
            heroSpeed = 0.045;
            keydown = true;
          }
          if (inputMap["2"]) {
            heroSpeed = 0.065;
            keydown = true;
          }
          if (inputMap["3"]) {
            heroSpeed = 0.085;
            keydown = true;
          }

          //Manage animations to be played
          if (keydown) {
            if (!animating) {
              animating = true;
              if (inputMap["s"]) {
                //Walk backwards
                walkBackAnim.start(
                  true,
                  1.0,
                  walkBackAnim.from,
                  walkBackAnim.to,
                  false
                );
              } else if (inputMap["b"]) {
                //Samba!
                sambaAnim.start(true, 1.0, sambaAnim.from, sambaAnim.to, false);
              } else {
                //Walk
                walkAnim.start(true, 1.0, walkAnim.from, walkAnim.to, false);
              }
            }
          } else {
            if (animating) {
              //Default animation is idle when no key is down
              idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);

              //Stop all animations besides Idle Anim when no key is down
              sambaAnim.stop();
              walkAnim.stop();
              walkBackAnim.stop();

              //Ensure animation are played only once per rendering loop
              animating = false;
            }
          }
        });
      }
    );
  }
}

class ExplodingBarrel {
  constructor() {
    BABYLON.SceneLoader.ImportMesh(
      "",
      "https://models.babylonjs.com/",
      "ExplodingBarrel.glb",
      scene
    );
  }
}
