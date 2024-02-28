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
    const file = fileInput.files[0];
    if (!file) {
        console.log('No file selected');
        alert('Error: No file selected');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);

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

async function getResponseDataThrows(response) {
    let data;
    try {
        data = await response.json();
    } catch (error) {
        console.log(`getResponseDataThrows: Could not parse Json`, response);
        throw new Error(response.statusText);
    }
    if (!response.ok) {
        console.log(`network response not ok`, data);
        throw new Error(data.error);
    }
    return data;
}

document.getElementById('chunkedUploadButton').addEventListener('click', chunkedUploadFile);

async function chunkedUploadFile() {
    // This is very unsophisticated. We simply slice the file and upload
    // the chunks sequentially.
    // TODO: implement more sophisticated error recovery and retry mechanisms.
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        console.log('No file selected');
        alert('Error: No file selected');
        return;
    }
    // get Chunked-Upload session from endpoint
    let task_id;
    try {
        task_id = await negotiateChunkedUpload(file.name);
    } catch (error) {
        console.error('Failed to acquire chunked upload session', error);
        alert('Error: ' + error.message);
        return;
    }

    // update progressBar
    const progressElement = document.getElementById('uploadProgress');
    const progressBarZero = `▯`.repeat(10);
    progressElement.innerText = `Upload progress: [${progressBarZero}] -init-`;
    
    // slice file in chunks
    const chunkSize = 1024 * 1024; // 1MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    // vars to capture latest response details
    var lastResponse = {};
    var i = 0
    try {
        for (; i < totalChunks; i++) {
            const startByte = i * chunkSize;
            const endByte = Math.min(file.size, (i + 1) * chunkSize);
            const chunk = file.slice(startByte, endByte);
            const contentRange = `bytes ${startByte}-${endByte - 1}/${file.size}`;
            
            const response = await fetch(getBackendUrl() + '/upload', {
                method: 'POST',
                headers: {
                    'Task-ID': task_id,
                    'Content-Range': contentRange,
                    'Authorization': 'Bearer ' + accessToken,
                },
                body: chunk,
            });
            lastResponse.status = response.status;
            const data = await getResponseDataThrows(response);
            lastResponse.data = data;
            
            //update visuals
            const progress = (i + 1) / totalChunks;
            const progressPercent = progress * 100;
            const progressFloorOutOfTen = Math.floor(progress * 10);
            const progressBar = `▮`.repeat(progressFloorOutOfTen) + `▯`.repeat(10 - progressFloorOutOfTen);
            console.log(`Chunk ${i + 1}/${totalChunks}:`, data);
            progressElement.innerText = `Upload progress: [${progressBar}] ${progressPercent.toFixed(2)}%`;
        }
        alert(lastResponse.data.message);
        if (lastResponse.status == 202) { // Server is still expecting more chunks
            throw new Error("Server did not ack end of upload despite receiving all chunks");
        }
    } catch (error) {
        console.error('Upload failed for chunk', i + 1, error);
        progressElement.innerText = 'Upload failed. See console for details.';
        alert('Error: ' + error.message);
    }
}

async function negotiateChunkedUpload(fileName) {
    const response = await fetch(getBackendUrl() + '/chunked-upload-session', {
        method: 'GET',
        headers: {
            'ngrok-skip-browser-warning': 'true',
            'Authorization': 'Bearer ' + accessToken,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
    });
    const data = await getResponseDataThrows(response);
    console.log(`Chunked-upload session granted, task_id=${data.task_id}`);
    return data.task_id;
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
