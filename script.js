let accessToken = null;

function getBackendUrl() {
    return document.getElementById('backendUrl').value;
}

function submitBackendUrl() {
    fetch(getBackendUrl() + '/')
        .then(response => response.text())
        .then(data => {
            // Display the backend message
            document.getElementById('backendMessage').textContent = data;

            // Hide the backend URL input
            document.getElementById('backendInputDiv').style.display = 'none';

            // Show the signup/login UI
            document.getElementById('authUI').style.display = 'block';
        })
        .catch(error => {
            alert('Error fetching backend message:', error);
        });
}

function signup() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    fetch(getBackendUrl() + '/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => alert('Error:', error));
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch(getBackendUrl() + '/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    })
    .then(response => response.json())
    .then(data => {
        accessToken = data.access_token;
        alert('Logged in successfully');
    })
    .catch(error => alert('Error:', error));
}

function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch(getBackendUrl() + '/upload', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
        body: formData,
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => alert('Error:', error));
}

function listFiles() {
    fetch(getBackendUrl() + '/list', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    })
    .then(response => response.json())
    .then(data => {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = ''; // Clear previous list
        data.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name;
            fileList.appendChild(li);
        });
    })
    .catch(error => alert('Error:', error));
}
