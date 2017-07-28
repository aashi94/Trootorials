const apiService = require('services/apiService'),
sql = require('services/sqlService'),
apiConfig = require('config/apiConfig');
var authenticate = require('services/authService');
util = require('util'),
os = require('os'),
formidable = require('formidable');
var fs = require('fs');

module.exports = function(app, passport) {
  // Add course
  app.post('/api/add-course/?', addCourseHandler); //checked

  // Get All Courses
  app.get('/api/all-courses/?', getCourseHandler); //checked

  //Update post
  app.post('/api/edit-course/:id/?', CourseUpdateHandler); //checked

  //get Update
  app.get('/api/get-course/:id/?', getCourseUpdateHandler); //checked

  //Delete
  app.post('/api/delete-course/:id/?', CourseDeleteHandler);

  //upload thumbnail
  app.post('/api/course/upload', uploadHandler); //checked
};


function uploadHandler ( req , res ) {
  var form = new formidable.IncomingForm(),
      files = [],
      fields = [];
  // console.log("OS" + JSON.stringify(os))
  form.parse(req);

  form.uploadDir ='courseUploads/'
  // os.tmpdir();

  form
    .on('field', function(field, value) {
      console.log(field, value);
      // if(field == 'path')
      // console.log("My fielssssssss"+field)
      fields.push([field, value]);
    })
    .on('file', function(field, file) {
      console.log(field, file);
      files.push([field, file]);
    })
    .on('end', function() {
      console.log('-> upload done');
      // res.writeHead(200, {'content-type': 'text/plain'});
      // res.write('received fields:\n\n '+util.inspect(fields));
      // res.write('\n\n');
      // console.log("filess "+file)
      // res.end('received files:\n\n '+util.inspect(files.data));
      res.end(JSON.stringify(files));

    });
}


function getCourseHandler(req, res, next) {
  authenticate.auth(req, res, function(status) {
    //console.log("status" + status);
    if (status) {
      sql.findAll(sql.courses, {}, function(obj) {
        if (obj.error == true || obj.data.length == 0)
          res.send({
            error: true,
            reason: "No data found"
          });
        else if (!obj.data)
          res.send({
            error: true,
            reason: "No data found"
          });
        else {
          res.send(obj);
        }
      });
    } else {
      res.send({
        error: 0
      });
    }
  })
}


function addCourseHandler(req, res, next) {
  authenticate.auth(req, res, function(status) {
    //console.log("status" + status);
    if (status) {
      var level = ''
      if(req.body.level == null){
        level = "beginner"
      }
      else {
        level = req.body.level
      }
      var data = {
        title: req.body.title,
        description: req.body.description,
        duration: req.body.duration,
        imageUrl: process.env['USER_CDN_ADDRESS']+"/"+req.body.imageUrl,
        level: level
      }
      if (!(data.title && data.description && data.duration )) {
        res.send({
          error: true,
          reason: "Insufficient parameters!!"
        });
      } else {
        var whereObj = {
          title: req.body.title
        }
        sql.findOne(sql.courses, whereObj, function(obj) {
          if (obj.data.id) {
            res.send({
              error: true,
              reason: 'course already created!!'
            })
          } else {
            sql.insert(sql.courses, data, function(obj) {
              res.send({
                error: false,
                response: "course created successfully",
                data: obj
              });
            })
          }
        })
      }
    } else {
      res.send({
        error: 0
      });
    }
  })
}

function CourseUpdateHandler(req, res, next) {
  authenticate.auth(req, res, function(status) {
    //console.log("status" + status);
    if (status) {
      var data = {
        title: req.body.title,
        description: req.body.description,
        duration: req.body.duration
      }

      var whereObj = {
        id: req.params.id
      }

      if (!req.params.id) {
        res.send({
          error: true,
          reason: "Insufficient parameters"
        });
      }
      if (!(data.title && data.description && data.duration)) {
        res.send({
          error: true,
          reason: "All fields not filled"
        });
      } else {
        sql.findOne(sql.courses, whereObj, function(obj) {
          if (!(obj.data.id)) {
            res.send({
              error: true,
              response: "Course does not exist"
            })
          } else {
            if(req.body.imageUrl != null){
              var filePath = 'courseUploads/'+obj.data.imageUrl.substring(obj.data.imageUrl.lastIndexOf('/')+1);
              fs.unlinkSync(filePath);
              data = {
                title: req.body.title,
                description: req.body.description,
                duration: req.body.duration,
                imageUrl: process.env['USER_CDN_ADDRESS']+"/"+req.body.imageUrl
              }
            }
            sql.update(sql.courses, data, whereObj, function(obj) {
              res.send({
                error: false,
                response: "Updated successfully"
              });
            });
          }
        });
      }
    } else {
      res.send({
        error: 0
      });
    }
  })
}


function CourseDeleteHandler(req, res, next) {
  authenticate.auth(req, res, function(status) {
    //console.log("status" + status);
    if (status) {
      var whereobj = {
        id: req.params.id
      }
      sql.findOne(sql.courses, whereobj, function(obj) {
        if (!req.params.id) {
          res.send({
            error: true,
            response: "Insufficient parameters"
          })
        } else if (!(obj.data.id)) {
          res.send({
            error: true,
            response: "Course does not exist"
          })
        } else {
          // console.log("obj"+JSON.stringify(obj))
          var filePath = 'courseUploads/'+obj.data.imageUrl.substring(obj.data.imageUrl.lastIndexOf('/')+1);;
          console.log(filePath)
          fs.unlinkSync(filePath);
          sql.delete(sql.courses, whereobj, function(obj) {
            res.send({
              error: false,
              response: "Course deleted successfully!!"
            })
          });
        }
      });
    } else {
      res.send({
        error: 0
      });
    }
  })
}


function getCourseUpdateHandler(req, res, next) {
  authenticate.auth(req, res, function(status) {
    //console.log("status" + status);
    if (status) {
      var whereObj = {
        id: req.params.id
      }
      //else {
      if (!req.params.id) {
        res.send({
          error: true,
          reason: "Insufficient parameters"
        });

      } else {
        sql.findOne(sql.courses, whereObj, function(obj) {
          if (!(obj.data.id)) {
            res.send({
              error: true,
              response: "Course does not exist"
            })
          } else {
            res.send({
              error: false,
              response: obj
            });
          }
        });
      }
    } else {
      res.send({
        error: 0
      });
    }
  })
}
