// set up the total length and length of each file
var totalLength;
// var totalLengthLoaded;
var totalNum;
var curNum;
var last_job_id;
window.requestForm = function requestForm()
{
    //document.getElementById("match_id").value = window.location.hash.slice(1);

// lordstone: modified from requestForm.js
// for multiple file uploading

    $("#file-select").on('change', function()
    {
        // var label = $(this).val().replace(/\\/g, '/').replace(/.*\//, '');
        var f =  document.getElementById('file-select').files;
        var insertHTML = '<tbody>';
        for(var i = 0; i < f.length; i ++){
            insertHTML += "<tr><td colspan = 6><p>" + f[i].name + "</p></td><td colspan=4><input type='checkbox' name='is_public'>public</td></tr>";
        }
				insertHTML += '</tbody>';
        $("#upload_file_table").html(insertHTML);
        $("#file-select-text").text('Change Files');
       //$("#file-select-button").toggleClass('btn-success');
    });
}
/*
function removeThis(index)
{
	// alert('Delete:' + index);
	
	var f =  document.getElementById('file-select').files;
	var fi = f[index];
	for(i in fi){
		alert('child:' + i);
	}
	
	document.getElementById('file-select').removeChild(document.getElementById('file-select').files);
	document.getElenebtById('upload_file_table').tbody.removeChild(index);
}
*/

window.uploadSubmit = function submit(response)
{
    var checker;
    // var grecaptcha = grecaptcha;
    $("#request").hide('slow');
    $("#messages").empty();
    $("#progContainer").show('slow');
    $("#loading").css("display", "block");
    // var match_id = document.getElementById("match_id").value;
    var fileSelect = document.getElementById('file-select');
// Get the selected files from the input.
    // var file = fileSelect.files[0];
    var files = fileSelect.files;
    console.log(files);
    // Create a new FormData object.
    var formData = new FormData();
	// formData.append('replay_blob', files, files.name);
    // totalLengthLoaded = 0; // set cur length loaded
    // var totalLength = 0;
		//formData.append('jiji', '123456');
		var is_public = [];
		var is_public_input = document.getElementsByName('is_public');
    for(var i = 0; i < files.length; i ++)
    {	
				is_public[i] = is_public_input[i].checked;
				console.log('is_public_' + i + ':' + is_public[i]);
				console.log(files[i]);
        formData.append('replay_blob', files[i], files[i].name);
    }
		formData.append('is_public', JSON.stringify({is_public: is_public}));
		// ispublic bool 
    formData.append('response', response);
    console.log(formData);
    // Set up the request.
    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", updateProgress);
    // Open the connection.
	// lordstone: use the customized upload_files api
    xhr.open('POST', '/api/upload_files', true);
    // Set up a handler for when the request finishes.
    xhr.onload = function()
    {
        var msg = JSON.parse(xhr.responseText);
        if (msg.error)
        {
            showError(msg.error);
        }
        else
        {
            checker = setInterval(function()
            {
                poll(msg.job.jobId);
            }, 2000);
        }
    };
    xhr.onerror = function(){
        submit();
    };
    // Send the Data.
    xhr.send(formData);
    //xhr.send(file);
    function updateProgress(oEvent)
    {
        if (oEvent.lengthComputable)
        {
            var percentComplete = oEvent.loaded / oEvent.total;
            console.log(percentComplete);
            var prog = percentComplete * 100;
            document.getElementById("upload-bar").style.width = prog + "%";
            document.getElementById("upload-bar").innerHTML = prog.toFixed(2) + "% uploaded";
            // skip the parsing phase
            if(prog >= 100){
                 document.getElementById("upload-bar").innerHTML = 'Upload Successful. Going to center...';
                 window.location.assign("/center");  
            }
			// total uploaded
            // var totalProg = oEvent.loaded / oEvent.total * 100;
            // var totalProg = oEvent.loaded / oEvent.total * 100;
            // var totalProg = (curNum / totalNum + (percentComplete / totalNum)) * 100;
            // document.getElementById("parse-bar").style.width = totalProg + "%";
            // document.getElementById("parse-bar").innerHTML = totalProg.toFixed(2) + "% Total Uploaded. (" + curNum + "/" + totalNum + "files uploaded)";
        }
    }

    function showError(data)
    {
        $("#messages").append("<div class='alert alert-danger' role='alert'>" + data + "</div>");
        $("#progContainer").hide('slow');
        $("#request").show('slow');
        console.log("clearing interval %s", checker);
        clearInterval(checker);
        // grecaptcha.reset();
    }

    function poll(job_id)
    {
        $.ajax(
        {
            url: "/api/upload_files?id=" + job_id
        }).done(function(msg)
        {
            console.log(msg);
            if (msg.state === "completed")
            {//lordstone: insert the next state logic for upload batch
             //   window.location.assign("/matches/" + (msg.data.payload.replay_blob_key || msg.data.payload.match_id));
                 curNum += 1;
                 if(curNum >= totalNum){
                      // all finished
 	                    $("#messages").append("<h2>Successfully Uploaded. Now you can go to center to view updates...</h2>");
                      //alert('All finished');
                      window.location.assign("/");         
                }
            }
            else if (msg.error)
            {
                showError(msg.error);
            }
            else if (msg.state === "failed")
            {
                showError("Failed to parse replay.  Please make sure the replay is available in client and has not expired.");
            }
            else if (msg.progress)
            {
				document.getElementById("message").innerHTML("debug: msg.progress");
				/*
                var prog = msg.progress;
                console.log(prog);
                document.getElementById("parse-bar").style.width = prog + "%";
                document.getElementById("parse-bar").innerHTML = prog.toFixed(2) + "% Total Uploaded";
				*/
            }
        });
    }
}
