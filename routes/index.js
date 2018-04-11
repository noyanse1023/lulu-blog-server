var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var common=require('../libs/common');
var moment = require('moment');

const db = mysql.createPool({
	host:'localhost',
	user:'root',
	'password':'123456',
	database:'blog'
})
//获取文章列表
router.post('/article',function(req,res,next){
	db.getConnection(function(err,conn){//连接数据库
		if(err) console.log('connect failed')//数据库连接失败
		conn.query('SELECT * FROM article_table',(err,data) => {//数据库连接成功
			if(err) console.log(err)
			// var articleData = data
			// articleData.context = (isNaN(articleData.context)) ? articleData.context.replace(/^/gm, '<p>').replace(/$/gm, '</p>') : null;
			res.send(data).end();
		})
		conn.release()//释放连接池
	})
})
//获取文章列表（分页）
router.post('/articlePage',function(req, res){
    var getpageNum = req.body.pageNum;//前台传入的参数   
    var startPage = parseInt(getpageNum * 2);//每次查找的起始点
    var limitNum = '2';//位置偏移，也就是每次需要查询的条数
    //sql获取总条数，获取要查询的数据
	var sql = `SELECT * FROM article_table limit ${startPage},${limitNum}`
    db.query(sql,function(err,doc){
        if (err) {
          console.log('数据库错误'+ err)
        } else {
         	res.send(doc).end();
        }
    })
})
//获取文章详情页
router.get('/article/detail',function(req,res,next){
	db.getConnection(function(err,conn){//连接数据库
		if(err) console.log('connect failed')//数据库连接失败
		// conn.query(`UPDATE article_table SET n_like=n_like+1 WHERE ID=${req.query.id}`)	点赞
		conn.query(`SELECT * FROM article_table WHERE id=${req.query.id}`,(err,data) => {//数据库连接成功
			if(err) console.log(err)
			res.send(data).end();
		})
		conn.release()//释放连接池
	})
})

//登陆／验证API  通用
router.post('/login', function(req, res){
    var username = req.body.username;
    var password = common.md5(req.body.password+common.MD5_SUFFIX);
    var resBody = {state:''}
    db.query(`SELECT * FROM user_table WHERE username='${username}'`,(err, doc) => {
        if(err){
        	res.status(500).send('err').end();
        }else{
            if(doc.length==0){
            	// console.log('0')
              resBody.state = 'no admin';
              res.send(resBody);
            } else{
            	// console.log(2)
              if(doc[0].password==password){
                req.session['admin_id']=doc[0].ID;
                resBody.state = 'success';
                res.send(doc).end();
               }else{
               	resBody.state = 'pwderr';              
				res.send(resBody).end();
              }
            }
        }
    })
})


//需要内容变化
router.get('/edit',(req,res)=>{
	db.query(`SELECT * FROM article_table`,(err,editblog) => {
		if(err){
			console.log(err);
			res.status(500).send('database err').end();
		}else{
			res.send(editblog)
		}
	})	
})

//修改页面数据
router.post('/mod',(req,res) => {
	var id = db.escape(req.body.id)
	var mod_title = req.body.mod_title;
	var mod_summary = req.body.mod_summary;
	var mod_context = db.escape(req.body.mod_context);
	db.query(`UPDATE article_table SET title="${mod_title}",context="${mod_context}",summary="${mod_summary}" WHERE id=${id}`,(err,data)=>{
			if(err){
				console.log(err);
				res.status(500).send('database err').end();
			}else{
				res.send('修改成功');
			}
		})
})
//修改数据的详细
router.post('/mod_data',(req,res) => {
	var id = db.escape(req.body.id);
	db.query(`SELECT * FROM article_table WHERE id=${id}`,(err,data)=>{
		if(err){
			console.log(err);
			res.status(500).send('database err').end();
		}else if(data.length==0){
			res.status(404).send('data not found').end();
		}else{
			db.query(`SELECT * FROM article_table`,(err,blogdetail)=>{
			if(err){
				console.log(err);
				res.status(500).send('database err').end();
			}else{
				res.send(data[0])
				}
			});
		}
	})
})
//删除数据库数据
router.post('/del',(req,res) => {
	var id = db.escape(req.body.id)//防止sq注入
	db.query(`DELETE FROM article_table WHERE ID='${id}'`,(err,data) => {
		if(err){
			console.log(err);
			res.status(500).send('database err').end();
		}else{
			res.send('删除成功')
		}
	})
})
// 写文章
router.post('/edit',(req,res)=>{
	var title = req.body.title;
	var summary = req.body.summary;
	var context = db.escape(req.body.context);
	var post_time = new Date().getTime();//获取当前时间
//处理时间戳
	moment.locale('zh-cn');
	var today = {};
	var _today = moment();
	today.year = _today.format('yyyy'); /*现在的年*/
	today.date = _today.format('YYYY-MM-DD'); /*现在的时间*/
	today.yesterday = _today.subtract(1, 'days').format('YYYY-MM-DD'); /*前一天的时间*/
	var postFormatDate = moment(post_time).format('YYYY-MM-DD HH:mm:ss'); /*格式化时间*/	
	db.query(`INSERT INTO article_table(author,author_src,title,context,post_time,n_like,summary) VALUES("mottoko@163.com","","${title}","${context}","${postFormatDate}",?,"${summary}")`,(err,data)=>{
		if(err){
			console.log(err);
			res.status(500).send('数据库错误').end();
		}else{
			res.json(data.insertId).end();
		}
	})	
})


//添加评论
router.post('/comment',(req,res) => {
	var user = req.body.comment_username;
	var comment = req.body.comment_text;
	var id = req.body.id;
	var post_time = new Date().getTime();//获取当前时间
//处理时间戳
	moment.locale('zh-cn');
	var today = {};
	var _today = moment();
	today.year = _today.format('yyyy'); /*现在的年*/
	today.date = _today.format('YYYY-MM-DD'); /*现在的时间*/
	today.yesterday = _today.subtract(1, 'days').format('YYYY-MM-DD'); /*前一天的时间*/
	var postFormatDate = moment(post_time).format('YYYY-MM-DD HH:mm:ss'); /*格式化时间*/	
	db.query(`INSERT INTO comment_table(comment_user,comment,comment_time,articleId) VALUES("${user}","${comment}","${postFormatDate}",${id})`,(err,data) => {
		if(err) console.log(err)
	    if(data.insertId>0){
	      res.json({'msg':'留言成功',code:200})
	    }else{
	      res.json({'msg':'留言失败稍后再试',code:100})
	    }
	})
})

//取出评论显示
router.post('/show-comment',(req,res) => {
	//根据文章ID取评论
	var articleId = req.body.articleId;
	db.query(`SELECT * FROM comment_table WHERE articleId=${articleId}`,(err,data) => {
		if(err) console.log(err)
		// console.log(articleId)
		// console.log(comment_time)
		console.log(data)
		res.send(data);
	})
})



module.exports = router;
