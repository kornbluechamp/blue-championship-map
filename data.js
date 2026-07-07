
const APP_DATA = {
  categories: {
    essentials:{label:"Essentials",icon:"★"},
    all:{label:"All",icon:"•"},
    restroom:{label:"Restrooms",icon:"🚻"},
    firstaid:{label:"First aid",icon:"✚"},
    concession:{label:"Concessions",icon:"🥤"},
    gate:{label:"Gate",icon:"G"},
    clubhouse:{label:"Clubhouse/Fan Zone",icon:"C"},
    fanarea:{label:"Fan areas",icon:"★"},
    volunteer:{label:"Volunteer HQ",icon:"V"},
    proshop:{label:"Pro shop",icon:"●"},
    hospitality:{label:"Hospitality",icon:"H"},
    accessible:{label:"Accessible",icon:"♿"},
    water:{label:"Water",icon:"W"},
    hole:{label:"Holes",icon:"⛳"}
  },
  calibration:{anchors:[]},
  views:{
    course:{
      title:"Full Course",
      image:"course-main.jpg",
      width:2420,
      height:1909,
      defaultFilter:"essentials",
      filters:["essentials","all","restroom","firstaid","concession","gate","clubhouse"],
      masks:[],
      markers:[
        {id:"course-restroom-8910",name:"Restrooms near Holes 8/9/10",category:"restroom",x:67.12,y:14.7,icon:"🚻",verified:false,essential:true,notes:"Approximate location from the official spectator map. Confirm the exact public entrance and cart-path approach onsite."},
        {id:"course-concession-8910",name:"Concessions near Holes 8/9/10",category:"concession",x:68.95,y:14.7,icon:"🥤",verified:false,essential:true,notes:"Approximate location from the official spectator map."},
        {id:"course-restroom-1213",name:"Restrooms near Holes 12/13",category:"restroom",x:80.02,y:45.1,icon:"🚻",verified:false,essential:true,notes:"Approximate location from the official spectator map."},
        {id:"course-concession-1213",name:"Concessions near Holes 12/13",category:"concession",x:81.63,y:43.9,icon:"🥤",verified:false,essential:true,notes:"Approximate location from the official spectator map."},
        {id:"course-restroom-314",name:"Restrooms near Holes 3/14",category:"restroom",x:49.61,y:63.0,icon:"🚻",verified:false,essential:true,notes:"Approximate location from the official spectator map."},
        {id:"course-concession-314",name:"Concessions near Holes 3/14",category:"concession",x:51.33,y:61.2,icon:"🥤",verified:false,essential:true,notes:"Approximate location from the official spectator map."},
        {id:"course-firstaid",name:"First Aid",category:"firstaid",x:26.19,y:77.0,icon:"✚",verified:false,essential:true,notes:"Approximate public first-aid location near the clubhouse complex. Confirm the public entrance onsite."},
        {id:"course-gate",name:"Main Admission Gate",category:"gate",x:16.52,y:79.1,icon:"G",verified:false,essential:true,notes:"Approximate main admission gate location."},
        {id:"course-clubhouse",name:"Clubhouse & Fan Zone",category:"clubhouse",x:21.57,y:80.1,icon:"C",verified:false,essential:true,notes:"Tap the Clubhouse & Fan Zone tab for the enlarged detail map."}
      ]
    },
    clubhouse:{
      title:"Clubhouse & Fan Zone",
      image:"clubhouse-detail.jpg",
      width:2200,
      height:2000,
      defaultFilter:"all",
      filters:["all","restroom","concession","fanarea","proshop","volunteer","hospitality"],
      masks:[],
      markers:[
        {id:"detail-exporow",name:"Expo Row",category:"fanarea",x:28.6,y:60.0,icon:"ER",verified:false,notes:"Approximate Expo Row location. Record the actual public entrance or entrances onsite."},
        {id:"detail-restroom",name:"Clubhouse-area Restrooms",category:"restroom",x:33.2,y:60.0,icon:"🚻",verified:false,notes:"Approximate location from the official detail inset."},
        {id:"detail-concession-west",name:"Clubhouse-area Concessions - West",category:"concession",x:37.7,y:59.8,icon:"🥤",verified:false,notes:"Approximate location from the official detail inset."},
        {id:"detail-ti",name:"The TAG Insurance Outlook",category:"fanarea",x:46.6,y:58.8,icon:"TI",verified:false,notes:"Approximate fan destination location."},
        {id:"detail-16deck",name:"16 Tee Public Viewing Deck",category:"fanarea",x:58.6,y:56.0,icon:"16D",verified:false,notes:"Approximate public viewing deck location."},
        {id:"detail-concession-east",name:"Clubhouse-area Concessions - East",category:"concession",x:68.0,y:58.8,icon:"🥤",verified:false,notes:"Approximate location near the clubhouse/pro shop side."},
        {id:"detail-proshop",name:"Pro Shop",category:"proshop",x:70.5,y:66.0,icon:"●",verified:false,notes:"Approximate pro shop location."},
        {id:"detail-volunteer",name:"Volunteer Headquarters",category:"volunteer",x:48.9,y:76.3,icon:"V",verified:false,notes:"Volunteer-only destination. Confirm the correct entrance before sharing directions."},
        {id:"detail-heroes",name:"Heroes Outpost",category:"fanarea",x:34.5,y:51.5,icon:"★",verified:false,notes:"Approximate fan destination location."},
        {id:"detail-18s",name:"18 Green Suites",category:"hospitality",x:44.5,y:42.0,icon:"18S",verified:false,notes:"Hospitality destination; access restrictions may apply."},
        {id:"detail-title",name:"Blue Federal Credit Union Title Sponsor Suite",category:"hospitality",x:37.7,y:30.5,icon:"B",verified:false,notes:"Hospitality destination; access restrictions may apply."},
        {id:"detail-15c",name:"15 Green Cabanas",category:"hospitality",x:66.4,y:27.5,icon:"15C",verified:false,notes:"Hospitality destination; access restrictions may apply."},
        {id:"detail-nest",name:"The Nest Benefiting NOCO Cares",category:"hospitality",x:65.5,y:34.0,icon:"N",verified:false,notes:"Hospitality destination; access restrictions may apply."},
        {id:"detail-summit",name:"The Summit Club",category:"hospitality",x:66.4,y:40.5,icon:"SC",verified:false,notes:"Hospitality destination; access restrictions may apply."}
      ]
    }
  }
};
