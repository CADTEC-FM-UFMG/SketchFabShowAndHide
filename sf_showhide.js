// Sketchfab Viewer API: Start/Stop the viewer
var version = "1.9.0";
var uid = "1e79ecc2ea2b4205bcdda6f9ef7462c1";

var urlParams = new URLSearchParams(window.location.search);
var autoSpin = 0.0;

if (urlParams.has("autospin")) {
  autoSpin = urlParams.get("autospin");
}

if (urlParams.has("id")) {
  uid = urlParams.get("id");
}

var iframe = document.getElementById("api-frame");
var client = new window.Sketchfab(version, iframe);
var treeText = "";

var error = function () {
  console.error("Sketchfab API error");
};

//var myNodesByNameFromGraph = {};
var idxNodes = 0;
var myNodesByNameFromMap = {};
var officialNodes = [];

var objectID = -1;

/*
var computeAssociativeArray = function(node){
		if (!node)  return;
    var name = node.name;
    if (!name) name = "noname_" + idxNodes++;       
                debugger;         		
    myNodesByNameFromGraph[name] = node;
    if (!node.children || !node.children.length) return;
  	for (var i = 0; i < node.children.length; i++){
  		computeAssociativeArray(node.children[i]);    
  	}
}
*/

var success = function (api) {
  api.start(function () {
    api.addEventListener("viewerready", function () {
      /*
          api.getSceneGraph(function (err, result) {
                if (err) {
                    console.log('-------Scene Graph--------------')
                    console.log('Error getting nodes');
                    return;
                }
                // get the id from that log
                //console.log(result);
              computeAssociativeArray(result);
                console.log("nodes indexed by names from scene node graph");
                console.log(myNodesByNameFromGraph);
            });
            */

      api.getNodeMap(function (err, nodes) {
        if (!err) {
          for (var instanceID in nodes) {
            var node = nodes[instanceID];
            var name = node.name;
            if (!name) name = "noname_" + idxNodes++;
            myNodesByNameFromMap[name] = node;
          }
          //console.log("nodes indexed by names from flattened array");
          //console.log(myNodesByNameFromMap);

          //attempt to look for a 'RootNode' - this seems to be present for FBX uploaded models
          rootNodeTree = myNodesByNameFromMap["RootNode"];

          if(rootNodeTree === undefined){
            //attempt to look for a 'root' - this seems to be present for OBJ or single object models
            rootNodeTree = myNodesByNameFromMap["root"];
          }

          if(rootNodeTree != undefined){

            recurse(rootNodeTree, rootNodeTree.children.length, 0);
            //console.log(officialNodes);

            //Now we can build the tree for the UI
            generateTree();
           } 

          var hideButtons = document.getElementsByClassName("Hide");
          //console.log('HIDE BUTTONS LENGTH: ' + hideButtons.length);
          for (let i = 0; i < hideButtons.length; i++) {
            hideButtons[i].addEventListener("click", function () {
              //api.hide(this.value);
              this.style.backgroundColor = "red";

              var childButtons = document
                .getElementById(this.value)
                .getElementsByClassName("Hide");
              console.log(" Child Buttons: " + childButtons.length);

              if (childButtons.length == 0) {
                api.hide(this.value);
              }

              for (let j = 0; j < childButtons.length; j++) {
                hideBTN = document.getElementById(childButtons[j].id);
                //console.log(childButtons[i].id);
                hideBTN.style.backgroundColor = "red";
                api.hide(hideBTN.value);
              }
            });
          }

          var showButtons = document.getElementsByClassName("Show");
          //console.log('SHOW BUTTONS LENGTH: ' + showButtons.length);
          for (let k = 0; k < showButtons.length; k++) {
            showButtons[k].addEventListener("click", function () {
              api.show(this.value);
              var hideBTN = document.getElementById(
                this.id + "_" + this.name + "Hide"
              );
              hideBTN.style.backgroundColor = "green";

              var childButtons = document
                .getElementById(this.value)
                .getElementsByClassName("Show");
              //console.log(' Child Buttons: ' + childButtons.length);
              for (let l = 0; l < childButtons.length; l++) {
                api.show(childButtons[l].value);
                hideBTN = document.getElementById(childButtons[l].id + "_Hide");
                hideBTN.style.backgroundColor = "green";
              }
            });
          }
        }
      });
      /*  
        document.getElementById('screenshot').addEventListener('click', function () {
           api.getScreenShot(800, 800, 'image/png', function (err, result) {
           if (!err) {
             var anchor = document.createElement('a');
             anchor.href = result;
             anchor.download = 'screenshot.png';
             anchor.innerHTML = '<img width="100" height="100" src=' + result + '>';
             document.getElementById('navTree').appendChild(anchor);
            }
          });
        });
        */

      /*
            document.getElementById('show').addEventListener('click', function () {
                api.show(id);
            });
            
            */
    });
  });
};
client.init(uid, {
  success: success,
  error: error,
  autostart: 1,
  preload: 1,
  autospin: autoSpin,
  transparent: 1
});
//////////////////////////////////
// GUI Code
//////////////////////////////////
function initGui() {
  var controls = document.getElementById("navTree");
  var buttonsText = "";
  buttonsText += '<button id="screenshot"></button>';
  controls.innerHTML = buttonsText;
}
//initGui();

function generateTree() {
  //console.log("Total Node Count: " + officialNodes.length);

  var tree = unflatten(officialNodes);
  //console.log(tree);

  //Create the HTML UL elemenet of the objects
  var navTree = document.getElementById("navTree");
  navTree.appendChild(to_ul(tree, "myUL"));

  var toggler = document.getElementsByClassName("caret");
  var i;

  for (i = 0; i < toggler.length; i++) {
    toggler[i].addEventListener("click", function () {
      this.parentElement.querySelector(".nested").classList.toggle("active");
      this.classList.toggle("caret-down");
    });
  }
}

function unflatten(arr) {
  var tree = [],
    mappedArr = {},
    arrElem,
    mappedElem;

  // First map the nodes of the array to an object -> create a hash table.
  for (var i = 0, len = arr.length; i < len; i++) {
    arrElem = arr[i];
    mappedArr[arrElem.instanceID] = arrElem;
    mappedArr[arrElem.instanceID].children = [];
  }

  for (var id in mappedArr) {
    if (mappedArr.hasOwnProperty(id)) {
      mappedElem = mappedArr[id];
      // If the element is not at the root level, add it to its parent array of children.
      if (mappedElem.parentID) {
        mappedArr[mappedElem.parentID].children.push(mappedElem);
      }
      // If the element is at the root level, add it to first level elements array.
      else {
        tree.push(mappedElem);
      }
    }
  }
  return tree;
}

/**********************
  GENERATE HTML UL TREE
**********************/
function to_ul(branches, setID = "", setClass = "") {
  var outerul = document.createElement("ul");
  var lengthOfName = 25;

  if (setID != "") {
    outerul.id = setID;
  }
  if (setClass != "") {
    outerul.className = setClass;
  }

  for (var i = 0, n = branches.length; i < n; i++) {
    var branch = branches[i];
    var li = document.createElement("li");

    var text = branch.name.replace(/_/g, " ");
    if (text.length > lengthOfName) {
      text = text.substring(0, lengthOfName);
      text += "...";
    }
    var textNode = document.createTextNode(text);

    if (branch.isParent) {
      var sp = document.createElement("span");
      sp.className = "caret";

      sp.appendChild(textNode);

      li.appendChild(sp);
      li.appendChild(createButton("Hide", branch.instanceID, branch.name));
      li.appendChild(createButton("Show", branch.instanceID, branch.name));
    } else {
      var sp2 = document.createElement("span");
      sp2.className = "caret_child";
      sp2.appendChild(textNode);
      li.appendChild(sp2);
      li.appendChild(createButton("Hide", branch.instanceID, branch.name));
      li.appendChild(createButton("Show", branch.instanceID, branch.name));
    }

    if (branch.children) {
      li.appendChild(to_ul(branch.children, branch.instanceID, "nested"));
    }

    outerul.appendChild(li);
  }

  console.log(outerul);
  return outerul;
}

function createButton(btnType, instance, name) {
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = btnType;

  if (btnType == "Hide") {
    btn.id = instance + "_" + name + "_" + btnType;
    btn.style.backgroundColor = "red";
    var btnText = document.createTextNode("Ocultar"); // Substitua "Hide" por "Ocultar"
  } else {
    btn.id = instance + "_" + name;
    var btnText = document.createTextNode("Mostrar"); // Substitua "Show" por "Mostrar"
  }
  btn.value = instance;
  btn.appendChild(btnText);

  return btn;
}

//////////////////////////////////
// GUI Code end
//////////////////////////////////

function recurse(nodeTree, childCount, theParentID) {
  if (typeof nodeTree != "undefined") {
    //Process the children of this node tree
    for (var i = 0; i < childCount; i++) {
      var node = {
        name: nodeTree.children[i].name,
        type: nodeTree.children[i].type,
        instanceID: nodeTree.children[i].instanceID,
        isParent: false,
        parentID: theParentID
      };

      if (node.type == "MatrixTransform") {
        //Determine if this node is a parent
        node.isParent = isParent(nodeTree.children[i].children);

        console.log(
          "   " +
            node.name +
            "(Node Type:" +
            node.type +
            ")" +
            "(Instance ID: " +
            node.instanceID +
            ")" +
            "(Is Parent: " +
            node.isParent +
            ")" +
            "(Parent ID: " +
            node.parentID +
            ")" +
            " Child Count :" +
            nodeTree.children[i].children.length
        );

        //Add this node to the complete node array list we are constructing
        officialNodes.push(node);

        recurse(
          nodeTree.children[i],
          nodeTree.children[i].children.length,
          nodeTree.children[i].instanceID
        );
      }
    }
  }
}

function isParent(children) {
  //Look through all the children to see if a "MatrixTransform" type exists...

  var result = false;

  for (var i = 0; i < children.length; i++) {
    if (children[i].type == "MatrixTransform") {
      result = true;
      console.log("PARENT NODE DETECTED");
      break;
    } else {
      result = false;
    }
  }

  return result;
}

// Sketchfab Viewer API: customize annotation appearance
var version = '1.12.1';
var uid = '1e79ecc2ea2b4205bcdda6f9ef7462c1';
var iframe = document.getElementById('api-frame');
if (!iframe) {
  console.log('no target');
}
if (!window.Sketchfab) {
  console.log('no Sketchfab library');
}
var client = new window.Sketchfab(version, iframe);
var imgBLogo;

// Code to create textureimage for pastille from svg
function computePastilles(wCanvas, hCanvas, bgColor, bgBorderColor, fgColor, fgBorderColor, text, numHotspot, wPastille, hPastille) {
  var wSize = wPastille / 10.0;
  var col = wCanvas / wSize;
  var row = hCanvas / wSize;
  var padding = 2;
  var w = wSize - padding;
  var cx;
  var cy = w * 0.5;
  //var cy = 24;

  var ty = cy + 8;
  var pastille = '';
  var num = 0;
  for (var i = 0; i < row; i++) {
    cx = wSize * 0.5;
    for (var k = 0; k < col; k++) {
      num++;
      var letters = text === 0 ? num : text[num];
      var circle = "<circle cx=\"".concat(cx, "\"\n            cy=\"").concat(cy, "\"\n            r=\"20\"\n            fill=\"").concat(bgColor, "\"\n            stroke=\"").concat(bgBorderColor, "\"\n            stroke-width=\"2\"/>");
      var textVG = "<text font-size=\"26\"\n          stroke=\"".concat(fgBorderColor, "\"\n          fill=\"").concat(fgColor, "\"\n          font-family=\"sans-serif\"\n          text-anchor=\"middle\"\n          alignment-baseline=\"baseline\"\n          x=\"").concat(cx, "\"\n          y=\"").concat(ty, "\">").concat(letters, "</text>");
      pastille += circle + textVG;
      cx += wSize;
    }
    cy += wSize;
    ty += wSize;
  }
  var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('version', '1.1');
  s.setAttribute('baseProfile', 'full');
  s.setAttribute('width', wPastille);
  s.setAttribute('height', hPastille);
  s.setAttribute('viewBox', "0 0 ".concat(wPastille, " ").concat(hPastille));
  s.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  s.innerHTML = pastille;
  // make it base64
  var svg64 = btoa(s.outerHTML);
  var b64Start = 'data:image/svg+xml;base64,';
  var image64 = b64Start + svg64;
  var textureOptions = {
    url: image64,
    colNumber: col,
    padding: padding,
    iconSize: w
  };
  return textureOptions;
}
function getNewPastilleURL(bgColor, bgBorderColor, fgColor, fgBorderColor, text, numHotspot, w, h) {
  var imageData;
  imageData = computePastilles(w, h, bgColor, bgBorderColor, fgColor, fgBorderColor, text, numHotspot, w, h);
  return imageData;
}
function actionSkfb() {
  // initialize
  var error = function error() {
    console.error('Sketchfab API error');
  };
  var success = function success(api) {
    api.start(function () {
      /////////////////
      api.addEventListener('viewerready', function () {
        var url = '';
        document.getElementById('white').addEventListener('click', function () {
          //url = getNewPastilleURL('rgba(255,255,255,0.75)', 'black', 'black', 'none', 0, 50, 512, 256);
          url = getNewPastilleURL('rgba(0,0,0,0.50)', 'white', 'white', 'none', 0, 50, 512, 256);
          api.setAnnotationsTexture(url, function () {});
        });
        document.getElementById('100').addEventListener('click', function () {
          url = getNewPastilleURL('rgba(255,255,255,0.75)', 'black', 'black', 'none', 0, 100, 512, 512);
          api.setAnnotationsTexture(url, function () {});
        });
        document.getElementById('200').addEventListener('click', function () {
          url = getNewPastilleURL('rgba(255,255,255,0.75)', 'black', 'black', 'none', 0, 200, 512, 1024);
          api.setAnnotationsTexture(url, function () {});
        });

        // start on 1 so "aa....
        document.getElementById('text').addEventListener('click', function () {
          url = getNewPastilleURL('rgba(255,255,255,1.0)', 'black', 'black', 'none', 'aabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 50, 512, 256);
          api.setAnnotationsTexture(url, function () {});
        });
        document.getElementById('discreet').addEventListener('click', function () {
          url = getNewPastilleURL('rgba(255,255,255,0.0)', 'black', 'black', 'none', 0, 50, 512, 256);
          api.setAnnotationsTexture(url, function () {});
        });
        document.getElementById('invisible').addEventListener('click', function () {
          url = getNewPastilleURL('rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 0, 50, 512, 256);
          api.setAnnotationsTexture(url, function () {});
        });
        document.getElementById('red').addEventListener('click', function () {
          url = getNewPastilleURL('rgba(255,0,0,1.0)', 'BLUE', 'green', 'white', 0, 50, 512, 256);
          api.setAnnotationsTexture(url, function () {});
        });
        document.getElementById('logos').addEventListener('click', function () {
          api.setAnnotationsTexture({
            url: imgBLogo,
            padding: 2,
            iconSize: 48,
            colNumber: 10
          }, function () {});
        });
      });
    });
  };
  client.init(uid, {
    success: success,
    error: error,
    autostart: 1,
    preload: 0,
    ui_infos: 0,
    ui_inspector: 0,
    ui_settings: 0,
    ui_vr: 0
  });
}
imgBLogo = 'data:image/png;base64,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';
actionSkfb();

//////////////////////////////////
// GUI Code
//////////////////////////////////
function initGui() {
  var controls = document.getElementById('controls');
  var buttonsText = "\n        <button id=\"white\">white</button>\n        <button id=\"100\">100</button>\n        <button id=\"200\">200</button>\n        <button id=\"text\">text</button>\n        <button id=\"red\">red</button>\n        <button id=\"invisible\">invisible</button>\n        <button id=\"discreet\">discreet</button>\n        <button id=\"logos\">logos</button>\n       ";
  controls.innerHTML = buttonsText;
}
initGui();

//////////////////////////////////
// GUI Code end
//////////////////////////////////
