import express from 'express';
import path,{dirname} from 'path';
import multer from 'multer';
import fetch from 'node-fetch';
import {fileURLToPath} from 'url';
import ejs from 'ejs';
import fs,{ promises as fsPromises } from 'fs';
import { default as FormData } from "form-data"
import axios from 'axios';
import saveRecording from 'opus-recorder';

var app = express();

const upload = multer({
    storage: multer.diskStorage({
      destination: 'uploads/',
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}-${Date.now()}${ext}`;
        cb(null, filename);
      },
    }),
  });

//配置引擎模板以及静态文件访问文件夹
// app.set('view engine', 'ejs');
// app.set('views', join(dirname,'view'));
// app.engine('html',require('ejs').__express);
// app.use(express.static(join(dirname,'static')));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'view'));
const staticPath = path.join(__dirname, 'static');
app.use(express.static(staticPath));
app.engine('html', ejs.renderFile);

//首页
app.get(['/','/index','/index.html'],function(req,res,next){
    res.render('index.html');
});

app.post('/imgUpload',upload.single('audio'), async(req, res) => {
  const filePath = path.join(__dirname, 'uploads',req.file.filename);
  const fileBuffer  = await fsPromises.readFile(filePath);
  
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer,req.file.filename)
    const response = await axios.post('http://192.168.5.113:5000/api/emotion/voice', formData, {
      headers:{
        'Content-Type': 'multipart/form-data', 
      },
    });
    const result = await response.data;
   
    const directoryPath=path.join(__dirname, 'uploads')
    fs.readdir(directoryPath,async (err, files) => {
      if (err) {
        console.error('Failed to read directory:', err);
        return res.status(500).send('Failed to clear directory');
      }
  
      // 删除目录下的每个文件和子目录
      files.forEach((file) => {
        const filePath = path.join(directoryPath, file);
        console.log('files',filePath)
        fs.rmSync(filePath, { recursive: true, force: true });
      });
    });
    console.error('請求數據成功');
    res.send('');
  } catch (error) {
    console.error('請求數據失敗');
    res.status(500).send('An error occurred');
  }
});

app.use('/imgUpload',async(req, res) => {
  const directoryPath=path.join(__dirname, 'uploads/')
  fs.readdir(directoryPath,async (err, files) => {
    if (err) {
      console.error('Failed to read directory:', err);
      return res.status(500).send('Failed to clear directory');
    }

    // 删除目录下的每个文件和子目录
    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      console.log('files',filePath)
      fs.rmSync(filePath, { recursive: true, force: true });
    });
  });
    res.status(404).send('404');  
});

var hostname = '127.0.0.1';
var port = 3000;
app.listen(port,hostname,function(err){
    if(err) throw err;
    console.log('server running at http://'+ hostname + ':' + port);
});

