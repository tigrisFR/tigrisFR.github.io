let accessToken = null;

function signup() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    fetch('YOUR_BACKEND_URL/signup', {
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

    fetch('YOUR_BACKEND_URL/login', {
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

    fetch('YOUR_BACKEND_URL/upload', {
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
    fetch('YOUR_BACKEND_URL/list', {
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
