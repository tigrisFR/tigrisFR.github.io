let accessToken = null;

function getBackendUrl() {
    return document.getElementById('backendUrl').value;
}

function handleResponse(response) {
    if (!response.ok) {
        // Handle non-OK responses by attempting to parse as JSON, but default to response.statusText if that fails.
        return response.json()
            .catch(() => Promise.reject(new Error(response.statusText)))
            .then(data => Promise.reject(new Error(data.error)));
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

function submitBackendUrl() {
    fetch(getBackendUrl() + '/', {
        
        method: 'GET',
        headers: {
            'ngrok-skip-browser-warning': 'true',
        }
    })
    .then(handleResponse)
    .then(data => {
        document.getElementById('backendMessage').textContent = data;
        document.getElementById('backendInputDiv').style.display = 'none';
        document.getElementById('authUI').style.display = 'block';
    })
    .catch(error => {
        alert('Error fetching backend message:' + error.message);
    });
}

function signup() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const inviteCode = document.getElementById("inviteCode").value;

    fetch(getBackendUrl() + '/signup', {
        method: 'POST',
        headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
            invite_code: inviteCode,
        }),
    })
    .then(handleResponse)
    .then(data => alert(data.message))
    .catch(error => alert('Error: ' + error.message));
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch(getBackendUrl() + '/login', {
        method: 'POST',
        headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    })
    .then(handleResponse)
    .then(data => {
        accessToken = data.access_token;
        alert('Logged in successfully');
    })
    .catch(error => alert('Error: ' + error.message));
}

function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch(getBackendUrl() + '/upload', {
        method: 'POST',
        headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': 'Bearer ' + accessToken,
        },
        body: formData,
    })
    .then(handleResponse)
    .then(data => alert(data.message))
    .catch(error => alert('Error: ' + error.message));
}

function listFiles() {
    fetch(getBackendUrl() + '/list', {
        method: 'GET',
        headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': 'Bearer ' + accessToken,
        },
    })
    .then(handleResponse)
    .then(data => {
        displayFiles(data)
    })
    .catch(error => alert('Error: ' + error.message));
}

function displayFiles(files) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    files.forEach(file => {
        const fileItem = document.createElement('li');
        
        const fileName = document.createElement('span');
        fileName.textContent = file.original_name;  // use original_name here
        
        const downloadLink = document.createElement('button');
        downloadLink.textContent = 'Download';
        downloadLink.onclick = function() { 
            downloadFile(file.id, file.original_name);  // use original_name for download
        }; 

        fileItem.appendChild(fileName);
        fileItem.appendChild(downloadLink);
        fileList.appendChild(fileItem);
    });
}

function downloadFile(fileId, originalFileName) {
    fetch(getBackendUrl() + '/download/' + fileId, {
        method: 'GET',
        headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': 'Bearer ' + accessToken,
        }
    })
    .then(response => response.blob())
    .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = originalFileName;  // use original_name for the downloaded file
        document.body.appendChild(downloadLink); 
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
    })
    .catch(error => console.error('Download failed:', error));
}
