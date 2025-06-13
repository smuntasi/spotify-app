# Spotify Content Filtering Application

## Local Development Setup
``` bash
git clone https://github.com/your-username/spotify-app.git
cd spotify-app
```

## Create a `.env` file in the root directory
Paste the given `POSTGRES_URI` string
  ```
  POSTGRES_URI="Your String Here"
  ```
## Install Dependencies in the root directory
```bash
npm install
```
## Set Up Python Virtual Enviroment in Backend Folder
Windows
  ```powershell
  python -m venv venv
  ```
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
  ```powershell
  pip install -r requirements.txt
  ```

Mac
  ```mac
  python3 -m venv venv
  ```
  ```mac
  source venv/bin/activate
  ```
  ```powershell
  pip install -r requirements.txt
  ```
---

## Start the Backend Server
Inside backend/
```
uvicorn server:app --reload
```
## Start the Frontend App
Inside src/
```
npm start
```