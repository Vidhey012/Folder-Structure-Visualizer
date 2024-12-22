let folderStructure = {}; 
let history = [];
let historyIndex = -1;

// Parses the folder structure from uploaded files
function parseFolderStructure(files) {
  const structure = {};
  Array.from(files).forEach(file => {
    const parts = file.webkitRelativePath.split('/');
    let current = structure;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? null : {}; 
      }
      current = current[part];
    });
  });
  return structure;
}

// Generates HTML for the folder tree view
function generateTreeViewHTML(structure, prefix = '', path = '') {
  let html = '';
  const entries = Object.entries(structure);

  entries.forEach(([name, content], index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? ' &nbsp;&nbsp;&nbsp;└── ' : ' &nbsp;&nbsp;&nbsp;├── ';
    const icon = content === null ? 
      `<i class="fas fa-file file-icon"></i>` : 
      `<i class="fas fa-folder folder-icon"></i>`; 

    const completePath = path ? `${path}/${name}` : name;

    const addButton = content !== null 
      ? `<i class="fas fa-plus-circle add-icon" onclick="addItem('${completePath}')"></i>` 
      : '';

    const deleteButton = `<i class="fas fa-times-circle delete-icon" onclick="deleteItem('${completePath}')"></i>`; 

    html += `${prefix}${connector}${addButton}&nbsp;${icon}&nbsp;${name}&nbsp;${deleteButton}<br>`;

    // Recursively generate child tree view if folder
    if (content !== null) {
      const childPrefix = prefix + (isLast ? '&nbsp;&nbsp;&nbsp;    ' : '&nbsp;&nbsp;&nbsp;│   ');
      html += generateTreeViewHTML(content, childPrefix, completePath);
    }
  });

  return html;
}

// Add new item (file or folder)
function addItem(parentPath) {
  Swal.fire({
    title: 'Add File 📁 / Folder 🗃️',
    input: 'text',
    inputPlaceholder: 'Enter file / folder name',
    showCancelButton: true,
    confirmButtonText: 'Add',
    cancelButtonText: 'Cancel',
    preConfirm: (value) => {
      if (!value.trim()) {
        Swal.showValidationMessage('Name cannot be empty');
        return false;
      }
      return value;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const newItem = result.value.trim();
      const isFile = newItem.includes('.');
      const parts = parentPath.split('/');
      let current = folderStructure;

      // Traverse to the target folder
      parts.forEach((part) => {
        current = current[part];
      });

      if (!current[newItem]) {
        current[newItem] = isFile ? null : {}; 
        saveHistory(); 
        renderFolderTree();
        Swal.fire({
          iconHtml: '<img src="assets\\graphics\\add.gif" style="height:100%; border-radius:50%;">',
          title: `${isFile ? 'File' : 'Folder'} added successfully! ✅`,
          showConfirmButton: false,
          customClass: {
            icon: 'no-border'
          }
        });
        // Swal.fire('Success', `${isFile ? 'File' : 'Folder'} added successfully!`, 'success');
      } else {
        Swal.fire({
          iconHtml: '<img src="assets\\graphics\\add.gif" style="height:100%; border-radius:50%;">',
          title: `${isFile ? 'File' : 'Folder'} already exists! ⚠️`,
          showConfirmButton: false,
          customClass: {
            icon: 'no-border'
          }
        });
        // Swal.fire('Error', 'Item with the same name already exists!', 'error');
      }
    }
  });
}

// Deletes an item from the folder structure
function deleteItem(path) {
  const parts = path.split('/');
  let current = folderStructure;

  // Traverse to the parent folder of the item to delete
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]]) {
      current = current[parts[i]];
    } else {
      console.error('Invalid path:', path);
      return;
    }
  }

  // Remove the item
  const itemToDelete = parts[parts.length - 1];
  if (current && current.hasOwnProperty(itemToDelete)) {
    delete current[itemToDelete];
  } else {
    console.error('Item not found:', itemToDelete);
  }

  saveHistory(); // Save the state for undo/redo
  renderFolderTree();
}

// Saves the current folder structure to history
function saveHistory() {
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1); 
  }
  history.push(JSON.parse(JSON.stringify(folderStructure)));
  historyIndex++;
}

// Undoes the last change
function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    folderStructure = JSON.parse(JSON.stringify(history[historyIndex]));
    renderFolderTree();
  }
}

// Resets the folder structure to the initial state
function reset() {
  while (historyIndex > 0) {
    historyIndex--;
    folderStructure = JSON.parse(JSON.stringify(history[historyIndex]));
  }
  renderFolderTree();
}

// Redoes the last undone change
function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    folderStructure = JSON.parse(JSON.stringify(history[historyIndex]));
    renderFolderTree();
  }
}

// Renders the folder tree view in the UI
function renderFolderTree() {
  const treeViewHTML = generateTreeViewHTML(folderStructure);
  const outputElement = document.getElementById('folderTree');
  document.getElementById('folderTree').style.backgroundColor="#e9ecef79";
  outputElement.innerHTML = treeViewHTML;
  outputElement.style.textAlign = 'left';
  if(treeViewHTML==""){
    outputElement.innerHTML = '<br/>No folder structure detected.<br/><br/>';
    outputElement.style.backgroundColor="#f7ae984f";
    outputElement.style.textAlign="center";
  }
}

// Copies the folder structure as plain text to the clipboard
function copyToClipboard() {
  const rootFolderName = Object.keys(folderStructure)[0] || 'Root_Folder';

    function formatFolderStructure(obj, indent = '', isLast = true) {
      let result = '';
      const entries = Object.entries(obj);
      const totalEntries = entries.length;
      entries.forEach(([key, value], index) => {
        const isCurrentLast = index === totalEntries - 1;
        const prefix = isLast ? '     ' : ' │   ';
        const currentIndent = `${indent}${isCurrentLast ? ' └── ' : ' ├── '}`;
        result += `${currentIndent}${key}\n`;
  
        if (value && typeof value === 'object') {
          result += formatFolderStructure(value, indent + (isCurrentLast ? '     ' : ' │   '), isCurrentLast);
        }
      });
      return result;
    }
    // Generate the tree-like string
    const textToCopy = `└── ${rootFolderName}\n` + formatFolderStructure(folderStructure[rootFolderName]);
  

  navigator.clipboard.writeText(textToCopy).then(() => {
    Swal.fire({
      iconHtml: '<img src="assets\\graphics\\clipboard.gif" style="height:100%; border-radius:50%;">',
      title: " Copied to Clipboard ✅ ",
      showConfirmButton: false,
      customClass: {
        icon: 'no-border'
      }
    });
    // alert('Tree structure copied to clipboard!');
  }).catch(err => {
    Swal.fire({
      iconHtml: '<img src="assets\\graphics\\clipboard.gif" style="height:100%; border-radius:50%;">',
      title: " Copied Failed ⚠️ ",
      showConfirmButton: false,
      customClass: {
        icon: 'no-border'
      }
    });
    // alert('Failed to copy: ' + err);
  });
}

// Saves the folder structure as a .txt file
function saveAsTxt() {
  const rootFolderName = Object.keys(folderStructure)[0] || 'Folder';


  // const textToSave = JSON.stringify(folderStructure, null, 2);


  function formatFolderStructure(obj, indent = '', isLast = true) {
    let result = '';
    const entries = Object.entries(obj);
    const totalEntries = entries.length;
    entries.forEach(([key, value], index) => {
      const isCurrentLast = index === totalEntries - 1;
      const prefix = isLast ? '     ' : ' │   ';
      const currentIndent = `${indent}${isCurrentLast ? ' └── ' : ' ├── '}`;
      result += `${currentIndent}${key}\n`;

      if (value && typeof value === 'object') {
        result += formatFolderStructure(value, indent + (isCurrentLast ? '     ' : ' │   '), isCurrentLast);
      }
    });
    return result;
  }
  // Generate the tree-like string
  const textToSave = `└── ${rootFolderName}\n` + formatFolderStructure(folderStructure[rootFolderName]);


  const blob = new Blob([textToSave], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = rootFolderName+"_Structure";
  link.click();
  Swal.fire({
    iconHtml: '<img src="assets\\graphics\\save.gif" style="height:100%; border-radius:50%;">',
    title: " Saved to Downloads ✅ ",
    showConfirmButton: false,
    customClass: {
      icon: 'no-border'
    }
  });
}

// Event listener: Handles folder input change
document.getElementById('folderInput').addEventListener('change', event => {
  const files = event.target.files;
  if (files.length > 0) {
    document.getElementById("action-strip").style.display="inline-flex"; // Show action buttons
    document.getElementById('folderTree').style.backgroundColor="#e9ecef79";
    folderStructure = parseFolderStructure(files);
    saveHistory();
    renderFolderTree();
  } else {
    document.getElementById("action-strip").style.display="none";
    const outputElement = document.getElementById('folderTree');
    outputElement.style.backgroundColor="#f7ae984f";
    outputElement.innerHTML = 'No folder structure loaded yet.<br/> Please upload a folder to view its contents..!';
    outputElement.style.textAlign = 'center';
  }
});

// Event listener: Reset folder structure
document.getElementById('resetButton').addEventListener('click', reset);

// Event listener: Copy folder structure
document.getElementById('copyButton').addEventListener('click', copyToClipboard);

// Event listener: Undo action
document.getElementById('undoButton').addEventListener('click', undo);

// Event listener: Redo action
document.getElementById('redoButton').addEventListener('click', redo);

// Event listener: Save folder structure as file
document.getElementById('saveButton').addEventListener('click', saveAsTxt);

// Popup functions

function mypage(){
  Swal.fire({
      imageUrl: 'assets\\graphics\\mypage.png',
      title: " Are you sure? 🤔",
      html: "You seem ready to leave!🚪<br/>Do you really want to quit? 😟",
      showCancelButton: true,
      confirmButtonText: 'Yes, Leave 🏠',
      cancelButtonText: 'No, Stay 😌',
      imageAlt: "Quit image"
    }).then((result) => {
      if(result.isConfirmed){
          window.open('https://vidhey.netlify.app/','_blank');
      } else {
          /* if not quitted */
      }       
    });
}
