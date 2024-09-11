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

//Button controllers
    function toggleFocus1(el) {
        el.style.backgroundColor = el.style.backgroundColor == "#00FF3E" ? "inherit" : "#00FF3E";
        el.style.color = "black";
    }

    function toggleFocus2(el) {
        el.style.backgroundColor = el.style.backgroundColor == "#419644" ? "inherit" : "#419644";
        el.style.color = "#fff";
    }
    
    function toggleFocus3(el) {
        // Altere a imagem do botão para a versão preta
        var buttonImage = document.getElementById("scrollToTop");
        buttonImage.querySelector("img").src = "https://cadtec.medicina.ufmg.br/home/wp-content/uploads/2023/10/up_arrow_black.png";
        buttonImage.style.backgroundColor = el.style.backgroundColor == "#91BBE5" ? "inherit" : "#91BBE5";
    }

    function toggleFocus4(el) {
        // Altere a imagem do botão para a versão branca
        var buttonImage = document.getElementById("scrollToTop");
        buttonImage.querySelector("img").src = "https://cadtec.medicina.ufmg.br/home/wp-content/uploads/2023/10/up_arrow_white.png";
        buttonImage.style.backgroundColor = el.style.backgroundColor == "#336699" ? "inherit" : "#336699";
    }
    
    function optionA(el) {
        el.style.transform = "translateY(4px)";
        el.style.boxShadow = "0 5px #666";
    }

    function toggleImage1(el) {
        el.style.opacity = "0.85";
        el.style.transform = "scale(1.20)";
        el.style.transition = "transform .2s"; /* Animação */
        el.parentElement.style.overflow = "hidden"; /* Adicionar overflow: hidden */
    }

    function toggleImage2(el) {
        el.style.opacity = "1.0";
        el.style.transform = "scale(1.0)";
        el.style.transition = "transform .2s"; /* Animação */
        el.parentElement.style.overflow = "hidden"; /* Adicionar overflow: hidden */
    }
    
    function toggleButtonStyle(el) {
        var mainContainer = el.closest(".container");

        if (el.classList.contains("active")) {
            el.style.transform = "translateY(0px)";
            el.style.boxShadow = "0 9px #495663";
            mainContainer.style.maxWidth = "230px";            
            mainContainer.style.float = "none";
            el.classList.remove("active");
        } else {
            el.style.transform = "translateY(4px)";
            el.style.boxShadow = "0 5px #495663";
            mainContainer.style.maxWidth = "470px";
            mainContainer.style.float = "none";
            el.classList.add("active");
        }
    }
    
    function showHiddenContainer1() {
        var hiddenContainer = document.getElementById("hiddenContainer1");

        if (hiddenContainer2.style.display === "none") {
            hiddenContainer2.style.display = "block";
            hiddenContainer2.style.maxWidth = "230px";
        } else {
            hiddenContainer2.style.display = "none";
            hiddenContainer2.style.maxWidth = "0px";
        }
    }
    
    function showHiddenContainer2() {
        var hiddenContainer = document.getElementById("hiddenContainer2");

        if (hiddenContainer2.style.display === "none") {
            hiddenContainer2.style.display = "block";
            hiddenContainer2.style.maxWidth = "230px";
        } else {
            hiddenContainer2.style.display = "none";
            hiddenContainer2.style.maxWidth = "0px";
        }
    }
    
    function showHiddenContainer3() {
        var hiddenContainer = document.getElementById("hiddenContainer3");

        if (hiddenContainer3.style.display === "none") {
            hiddenContainer3.style.display = "block";
            hiddenContainer3.style.maxWidth = "230px";
        } else {
            hiddenContainer3.style.display = "none";
            hiddenContainer3.style.maxWidth = "0px";
        }
    }
    
    function showHiddenContainer4() {
        var hiddenContainer = document.getElementById("hiddenContainer4");

        if (hiddenContainer4.style.display === "none") {
            hiddenContainer4.style.display = "block";
            hiddenContainer4.style.maxWidth = "230px";
        } else {
            hiddenContainer4.style.display = "none";
            hiddenContainer4.style.maxWidth = "0px";
        }
    }
    
    function showHiddenContainer5() {
        var hiddenContainer = document.getElementById("hiddenContainer5");

        if (hiddenContainer5.style.display === "none") {
            hiddenContainer5.style.display = "block";
            hiddenContainer5.style.maxWidth = "230px";
        } else {
            hiddenContainer5.style.display = "none";
            hiddenContainer5.style.maxWidth = "0px";
        }
    }
    
    function showHiddenContainer6() {
        var hiddenContainer = document.getElementById("hiddenContainer6");

        if (hiddenContainer6.style.display === "none") {
            hiddenContainer6.style.display = "block";
            hiddenContainer6.style.maxWidth = "230px";
        } else {
            hiddenContainer6.style.display = "none";
            hiddenContainer6.style.maxWidth = "0px";
        }
    }
    
    function showHiddenContainer7() {
        var hiddenContainer = document.getElementById("hiddenContainer7");

        if (hiddenContainer7.style.display === "none") {
            hiddenContainer7.style.display = "block";
            hiddenContainer7.style.maxWidth = "230px";
        } else {
            hiddenContainer7.style.display = "none";
            hiddenContainer7.style.maxWidth = "0px";
        }
    }

    function showHiddenContainer8() {
        var hiddenContainer = document.getElementById("hiddenContainer8");

        if (hiddenContainer8.style.display === "none") {
            hiddenContainer8.style.display = "block";
            hiddenContainer8.style.maxWidth = "230px";
        } else {
            hiddenContainer8.style.display = "none";
            hiddenContainer8.style.maxWidth = "0px";
        }
    }

    function showHiddenContainer9() {
        var hiddenContainer = document.getElementById("hiddenContainer9");

        if (hiddenContainer9.style.display === "none") {
            hiddenContainer9.style.display = "block";
            hiddenContainer9.style.maxWidth = "230px";
        } else {
            hiddenContainer9.style.display = "none";
            hiddenContainer9.style.maxWidth = "0px";
        }
    }

    function showHiddenContainer10() {
        var hiddenContainer = document.getElementById("hiddenContainer10");

        if (hiddenContainer10.style.display === "none") {
            hiddenContainer10.style.display = "block";
            hiddenContainer10.style.maxWidth = "230px";
        } else {
            hiddenContainer10.style.display = "none";
            hiddenContainer10.style.maxWidth = "0px";
        }
    }
    

    function myFunction(x) {
  if (x.matches) { // If media query matches
    document.body.style.backgroundColor = "white";
  } else {
   document.body.style.backgroundColor = "white";
  }
}

var x = window.matchMedia("(max-width: 700px)")
myFunction(x) // Call listener function at run time
x.addListener(myFunction) // Attach listener function on state changes

    // Função para rolar de volta ao topo da página
        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Exibir o botão quando o usuário rolar para baixo
        window.onscroll = function () {
            if (document.body.scrollTop > 450 || document.documentElement.scrollTop > 450) {
                document.getElementById("scrollToTop").style.display = "block";
                document.getElementById("search-button-image").style.display = "block";
            } else {
                document.getElementById("scrollToTop").style.display = "none";
                document.getElementById("search-button-image").style.display = "none";
            }
        }

