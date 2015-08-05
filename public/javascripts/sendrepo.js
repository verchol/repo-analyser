$(function(){
  $("#parse").click(function(){
    var repoName =  $("input:first" ).val();
    var gitUrl =  $("input[name=gitUrl]" ).val();
    var start  = moment();
    console.log("users's data" + repoName + ","  + gitUrl);
    $.ajax({
      method: "POST",
      url: "/git/parse",
      data: {gitUrl:gitUrl, repoName : repoName}
    }).done(function( msg ) {
        var end = moment();
        var t = end - start;
        $("#repodata").text(msg);
       
      });
  });
  $( "#clone" ).submit(function(event) {


    event.preventDefault();
    var repoName =  $("input:first" ).val();
    var gitUrl =  $("input[name=gitUrl]" ).val();
    var start  = moment();
    console.log("users's data" + repoName + ","  + gitUrl);
    $.ajax({
      method: "POST",
      url: "/git/clone",
      data: {gitUrl:gitUrl, repoName : repoName}
    })
  .done(function( msg ) {
    var end = moment();
    var t = end - start;

    alert( "Time elapsed " + t);
  });
    console.log(event.data);

  });

});
