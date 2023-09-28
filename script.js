let accessToken = null;

function getBackendUrl() {
    return document.getElementById('backendUrl').value;
}

function handleResponse(response) {
    if (!response.ok) {
        return response.json().then(data => {
            throw new Error(data.error || 'Something went wrong.');
        });
    }
    if (response.headers.get('content-type').includes('application/json')) {
        return response.json();
    } else {
        return response.text();
    }
}

function submitBackendUrl() {
    fetch(getBackendUrl() + '/')
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
            'Authorization': 'Bearer ' + accessToken,
        },
    })
    .then(handleResponse)
    .then(data => {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        data.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name;
            fileList.appendChild(li);
        });
    })
    .catch(error => alert('Error: ' + error.message));
}
