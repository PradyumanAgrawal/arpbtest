const studyResRouter = require('express').Router();
const resSchema = require('../models/firebasedb.js');
const studyResources = require('../models/firebasedb.js').studyResources;
const schema = require('../models/firebasedb.js').schema;
const storage = require('../models/firebasedb.js').storage;
const firebase  = require('firebase/app');
const firestore = require('firebase/firestore');

// PORT=3000
//
//
// apiKey=AIzaSyCWnzq8fkvTjGvKNMarbBesMSf7aCx_2mk
// authDomain=arpbackend-7b652.firebaseapp.com
// databaseURL=https://arpbackend-7b652.firebaseio.com
// projectId=arpbackend-7b652
// storageBucket=arpbackend-7b652.appspot.com
// messagingSenderId=328288803137
// appId=1:328288803137:web:416dadc97ae61d8dfbe9c0
// measurementId=G-636FY08DNC



//get all resources
studyResRouter.get('/admin',(req,res,next)=>{

  //   studyResources.get()
  // .then((snapshot) => {
  //       console.log("in2");
  //       for(let doc of snapshot.docs){
  //         console.log("in");
  //         console.log(doc.data());
  //       }
  //

  // studyResources.doc('CS').collection('CS2L003').doc('PQvrbm2KP9MjuyKQktn7').get().then((snapshot)=>{
  //     console.log(snapshot.data());
  // }).catch((err)=>{next(err);});
  //
  studyResources.get().then((snapshot)=>{
      //console.log(snapshot);
      snapshot.forEach((doc)=>{
            console.log(doc.data());
          })
        }).catch(err => next(err));

  //     });
  //     // for(let c of snapshot)
  //     //  console.log(snapshot.collectionGroup);
  // }).catch((err)=>{next(err);});
  //

    // snapshot.forEach((doc) => {
    //   console.log("in");
    //   console.log(doc.data());
    // });

  // .catch((err) => {
  //   next(err);
  //   console.log('Error getting documents', err);
  // });

   res.json({hi :"Hello"}).end();
});
studyResRouter.get('/', async (req,res,next)=>{
    let list = [];
    studyResources.get().then((branches)=>{
       branches.forEach((branch)=>{
            branch.getCollections().then((subjects)=> {
                subjects.forEach((subject) => {
                    subject.where('flag','>',"0").get().then((resource)=>{
                        list.push(resource);
                    }).catch((err)=>next(err));
                })
            }).catch((err)=>next(err));
       })
    }).catch((err)=>next(err));
    // try{
    //     let branches = await studyResources.get();
    //     console.log(branches);
    //     console.log(typeof branches);
    //     for (const branch of branches) {
    //         let subjects = await branch.getCollections();
    //         for (const subject of subjects) {
    //             let resource = await subject.get();
    //             list.push(resource);
    //         }
    //     }
    //     res.status(200).json(list);
    // }catch(error){
    //     next(error)
    // }
});

//get all subjects of a branch
studyResRouter.get('/:branch/', async (req,res,next)=>{
//.then
    // var list = [];
    // studyResources
    // .doc(req.params.branch)
    // .listCollections()
    // .then(subjects => {
    //   subjects.forEach(subject => {
    //       subject.get().then(docs=>{
    //         docs.forEach(doc=>{
    //           if(doc.data().review === true){
    //             let subName = doc.data().subjectName;
    //             let subCode = doc.data().subjectCode;
    //             let obj = {subjectName : subName, subjectCode : subCode};
    //             list.push(obj);
    //             console.log(list);
    //             console.log("ok");
    //           }
    //         });
    //       //   for(let doc of docs){
    //       //       if(doc.data().review === true){
    //       //         let subName = doc.data().subjectName;
    //       //         let subCode = doc.data().subjectCode;
    //       //         let obj = {subjectName : subName, subjectCode : subCode};
    //       //         list.push(obj);
    //       //         break;
    //       //   }
    //       // }
    //     }).then(() => {
    //       console.log(list);
    //       console.log("ok2");
    //     }).catch(err => next(err));
    //
    //   });
    //
    //
    // }).then( (list)=> {res.status(200).send(list);}).catch(err => next(err));









    try{
        var list = [];
        let subjects = await studyResources.doc(req.params.branch).listCollections();
        //for(const subject of subjects)
        subjects.forEach(async (subject)=>{
            let resources = await subject.get();
          //  for(const resource of resources)
            resources.forEach(async (resource)=>{
                let flag = true;
                if (resource.data().review && flag ) {
                    let subName = resource.data().subjectName;
                    let subCode = resource.data().subjectCode;
                    list.push({subjectName: subName, subjectCode: subCode});
                    flag = false;
                }
            })
        })
        res.status(200).send(list);
    }catch(error)
    {
        next(error);
    }
});

//get resource by subjectcode
studyResRouter.get('/:branch/subjects/:subjectCode',(req,res,next)=>{
    try{
        let resource = studyResources
            .doc(req.params.branch)
            .collection(req.params.subjectCode)
            .get();
        res.status(200).send(resource)
    }catch(error) {
        next(error);
    }
});

studyResRouter.put('/:branch/subjects/:subjectCode/resources/:uniqueId',async (req,res,next)=>{
    try{
        let resource = await studyResources
            .doc(req.params.branch)
            .collection(req.params.subjectCode)
            .where("resourceId","==",req.params.uniqueId).get();
        let newflags = resource['flag']+1;
        let flagArray = resource['flagReason'];
        flagArray.push(req.body.flagReason);
        studyResources
            .doc(req.params.branch)
            .collection(req.params.subjectCode)
            .where("resourceId","==",req.params.uniqueId)
            .update({flags : newflags, flagReason: flagArray})
            .then(()=>res.send(204).end());
    }catch(error){
        next(error);
    }

});

studyResRouter.delete('/:branch/subjects/:subjectCode/resources/:uniqueId',async (req,res,next)=>{
    try{
        let resource = await studyResources
            .doc(req.params.branch)
            .collection(req.params.subjectCode)
            .where("resourceId","==",req.params.uniqueId).get();
        let downloadLink = resource.downloadLink;
        let resourceRef = await storage.refFromURL(downloadLink);
        resourceRef.delete().then(()=>{
              res.send(204).end();
        }).catch((err)=>{
              next(err)
        });
    }catch(error){
        next(error);
    }
});

//get all resources
studyResRouter.get('/search', async (req,res,next)=>{
    let list = [];
    try{
        let branches = await studyResources.get();
        for (const branch of branches) {
            let subjects = await branch.getCollections();
            for(const subject of subjects){
                let resources = await subject.get();
                for(const resource of resources) {
                    if (resource.data().review) {
                        let subName = resource.data().subjectName;
                        let subCode = resource.data().subjectCode;
                        list.push({subjectName: subName, subjectCode: subCode});
                        break;
                    }
                }
            }
        }
        res.status(200).send(list);
    }catch(error){
        next(error)
    }
    try{
        let list = [];
        let subjects = await studyResources.doc(req.params.branch).listCollections();
        for(const subject of subjects){
            let resources = await subject.get();
            for(const resource of resources) {
                if (resource.review) {
                    let subName = resource.subjectName;
                    let subCode = resource.subjectCode;
                    list.push({subjectName: subName, subjectCode: subCode});
                    break;
                }
            }
        }
        res.status(200).send(list);
    }catch(error)
    {
        next(error);
    }
});

//get resource by subjectcode
studyResRouter.get('/:branch/subjects/:subjectCode',(req,res,next)=>{
    try{
        let resource = studyResources
            .doc(req.params.branch)
            .collection(req.params.subjectCode)
            .get();
        res.status(200).send(resource)
    }catch(error) {
        next(error);
    }
});

studyResRouter.put('/:branch/subjects/:subjectCode/resources/:uniqueId',async (req,res,next)=>{
    try{
        let resource = await studyResources
            .doc(req.params.branch)
            .collection(req.params.subjectCode)
            .where("resourceId","==",req.params.uniqueId).get();
        let newflags = resource['flag']+1;
        let flagArray = resource['flagReason'];
        flagArray.push(req.body.flagReason);
        studyResources
            .doc(req.params.branch)
            .collection(req.params.subjectCode)
            .where("resourceId","==",req.params.uniqueId)
            .update({flags : newflags, flagReason: flagArray})
            .then(()=>res.send(204).end());
    }catch(error){
        next(error);
    }

});

studyResRouter.delete('/:branch/subjects/:subjectCode/resources/:uniqueId',async (req,res,next)=>{
    try{
        let resource = await studyResources
            .doc(req.params.branch)
            .collection(req.params.subjectCode)
            .where("resourceId","==",req.params.uniqueId).get();
        let downloadLink = resource.downloadLink;
        let resourceRef = await storage.refFromURL(downloadLink);
        resourceRef.delete().then(()=>{
              res.send(204).end();
        }).catch((err)=>{
              next(err)
        });
    }catch(error){
        next(error);
    }
});

//get all resourcescopy
studyResRouter.get('/searchcopy',(req,res,next)=>{
    //let list = [];
    try{
      console.log("In here 0");
        studyResources.get().then(branches=>{
          console.log("In here 1");
          branches.forEach(branch=>{

              branch.getCollections().then(subjects=>{
                subjects.forEach(subject=>{
                    subject.get().then(resources=>{
                      resources.forEach(resource=> {
                          //if (resource.review)
                          console.log("In here")
                           {
                              let subName = resource.data().subjectName;
                              let subCode = resource.data().subjectCode;
                              list.push({subjectName: subName, subjectCode: subCode});
                              //break;
                              console.log(subName+"  "+subCode)
                          }
                      })
                    });
                })
              });
          })
          res.status(200).send(list);
        });
    }catch(error){
        next(error)
    }










});

//upload resources of a subject code
studyResRouter.post('/:branch/subjects/:subjectCode', async (req,res,next)=>{
   try {
       let resourceObj = {
           emailId: req.body.emailId,
           subjectName: req.body.subjectName,
           type: req.body.type,
           semester: req.body.semester,
           flags: 0,
           subjectCode: req.body.subjectCode,
           year: req.body.year,
           review: false,
           downloadLink: req.body.downloadId,
           flagReason: []
       };

       let resource = await studyResources
           .doc(req.params.branch)
           .collection(req.params.subjectCode)
           .doc();
       resourceObj['resourceId'] = resource.id;
       resource.set(resourceObj)
           .then(() => res.status(201).end());
   }catch(err){
       next(err);
   }
});

module.exports = studyResRouter;
