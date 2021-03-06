/*
 * Copyright (c) 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

$(document).ready(function() {

	var serviceURL = "/start/api/v1";
	var technologies = [];
	var currentStep = 1;

	var populateTechnologies = function() {
		var step1TechnologiesContainer = $("#step1TechnologiesContainer");
		step1TechnologiesContainer.empty();
		for(var i = 0; i < technologies.length; i++) {
			var technology = technologies[i];
			var technologyTag = $("<a href=\"#\" class=\"step1Technology\" data-technologyname=\""+ technology.name +"\" data-technologyid=\"" + technology.id + "\">" + technology.name + "</a>");
			technologyTag.append('<span class="state-checkmark"></span>');
			step1TechnologiesContainer.append(technologyTag);
		}
	};

	var getCurrentStep = function() {
		var windowScroll = $(window).scrollTop();
		for(var i = 0; i < 3; i ++) {
			var shift = 55 * (i + 1) + i;
			var step = $("#step" + (i + 1));
			var stepOffset = step.offset();
			var height = step.outerHeight();
			if(windowScroll + shift < stepOffset.top + height) {
				return i + 1;
			}
		}
	};

	var updateSteps = function() {

		var step = getCurrentStep();
		if(step != currentStep) {
			var navigationBottomContainer = $("#navigationBottomContainer");
			var navigationTop1 = $("#navigationTop1");
			var navigationTop2 = $("#navigationTop2");
			switch(step) {
			case 1:
				if(navigationTop1.is(":visible")) {
					navigationTop1.fadeOut();
				}
				if(navigationTop2.is(":visible")) {
					navigationTop2.fadeOut();
				}
				if(!navigationBottomContainer.is(":visible")) {
					navigationBottomContainer.fadeIn();
				}
				$("#navigationBottom2").fadeOut(function() {
					$("#navigationBottom1").fadeIn();
				});
				break;
			case 2:
				if(!navigationTop1.is(":visible")) {
					navigationTop1.fadeIn();
				}
				if(navigationTop2.is(":visible")) {
					navigationTop2.fadeOut();
				}
				if(!navigationBottomContainer.is(":visible")) {
					navigationBottomContainer.fadeIn();
				}
				$("#navigationBottom1").fadeOut(function() {
					$("#navigationBottom2").fadeIn();
				});
				break;
			case 3:
				if(!navigationTop1.is(":visible")) {
					navigationTop1.fadeIn();
				}
				if(!navigationTop2.is(":visible")) {
					navigationTop2.fadeIn();
				}
				if(navigationBottomContainer.is(":visible")) {
					navigationBottomContainer.fadeOut();
				}
				break;
			}
			currentStep = step;
			updateNextSectionEnablement();
		}
	};

	var updateStep1Summary = function() {
		var selectedTechnologies = $("#step1TechnologiesContainer .step1Technology.selected");
		var selectedTechnologiesText = "";
		for(var i = 0; i < selectedTechnologies.size(); i++) {
			selectedTechnologiesText += selectedTechnologies.get(i).dataset.technologyname;
			if(i + 1 < selectedTechnologies.size()) {
				selectedTechnologiesText += ", ";
			}
		}
		$("#navigationTop1 .variableContent").text(selectedTechnologiesText);
	};

	var refreshSectionVisibility = function() {
		var currentlyVisibleSections = $(".step:not(.hidden").size();
		var selectedTechnologies = $("#step1TechnologiesContainer .step1Technology.selected");
		if(selectedTechnologies.size() == 0) {
			$("#step2, #step3").addClass("hidden");
		} else {
			$("#step2").removeClass("hidden");
			var selectedLocation = $("#step2DeployLocationsContainer .step2DeployLocation.selected").size() > 0;
			if(!selectedLocation) {
				$("#step3").addClass("hidden");
			} else {
				$("#step3").removeClass("hidden");
			}
		}
		var visibleSections = $(".step:not(.hidden").size();
		if(currentlyVisibleSections != visibleSections) {
			if(currentStep == 1 && $.scrollify.isDisabled()) {
				window.setTimeout(function() {
					$.scrollify.enable();
				}, 500);

			}
			$.scrollify.update();
			updateNextSectionEnablement();
		}
	};

	var updateNextSectionEnablement = function() {
		if($("#step" + (currentStep + 1)).hasClass("hidden")) {
			$("#navigationBottomContainer").addClass("disabled");
		} else {
			$("#navigationBottomContainer").removeClass("disabled");
		}
	};

	var retrieveTechnologiesFromServer = function() {
        return $.ajax({
            url: serviceURL + "/tech",
            success: function(response) {
                technologies = response;
            }
        });
    };

	var submitRequest = function() {

		// Selected technologies
		var selectedTechnologies = $("#step1TechnologiesContainer .step1Technology.selected");
		var url = serviceURL + "/data?tech=";
		for(var i = 0; i < selectedTechnologies.size(); i++) {
			url += selectedTechnologies.get(i).dataset.technologyid;
			if(i + 1 < selectedTechnologies.size()) {
				url += "&tech=";
			}
		}

		// Deploy location
		var deployLocation = $("#step2DeployLocationsContainer .step2DeployLocation.selected").data("value");
		url += "&deploy=" + deployLocation;

		// Project name
		var projectName = $("#step3NameInput").val();
		if(projectName != "") {
			url += "&name=" + projectName;
		} else {
			url += "&name=" + "libertyProject";
		}
		window.location.assign(url);
	};

	$("#step1TechnologiesContainer").on("click", ".step1Technology", function(event) {
		event.preventDefault();
		$(event.currentTarget).toggleClass("selected");
		updateStep1Summary();
		refreshSectionVisibility();
	});

	$("#step2DeployLocationsContainer .step2DeployLocation").on("click", function(event) {
		event.preventDefault();
		$("#step2DeployLocationsContainer .step2DeployLocation").removeClass("selected");
		$(event.currentTarget).addClass("selected");
		$("#navigationTop2 .variableContent").text(event.currentTarget.dataset.text);
		if(event.currentTarget.dataset.value == "local") {
			$("#step3Bluemix").addClass("hidden");
			$("#step3Local").removeClass("hidden");
		} else {
			$("#step3Local").addClass("hidden");
			$("#step3Bluemix").removeClass("hidden");
		}

		refreshSectionVisibility();
	});

	$("#navigationBottomContainer").click(function(event) {
		event.preventDefault();
		if(!$("#navigationBottomContainer").hasClass("disabled")) {
			$.scrollify.next();
		}
	});

	$(".navigationTop").click(function(event) {
		event.preventDefault();
		$.scrollify.move(Number(event.currentTarget.dataset.targetsection));
	});

	$(window).scroll(function() {
		updateSteps();
	});

	$("#step3DownloadButton").click(function(event) {
		event.preventDefault();
		submitRequest();
	});

	$("#helpUsToHelpYouGetInTouchButton").click(function(event) {
		event.preventDefault();
		window.open("https://github.com/WASdev/tool.artisan.core/issues/", "_blank");
	});

	$("#gitHubLink").click(function(event) {
		event.preventDefault();
		window.open("https://github.com/WASdev/tool.artisan.core/", "_blank");
	});

    $("#step3NameInput").on("keypress", function(event) {
		if(!(/[a-z0-9]/i.test(event.key) || event.key == "-" || event.key == "_")) {
			event.preventDefault();
		}
	});

	retrieveTechnologiesFromServer().done(function() {
		populateTechnologies();

		$("#navigationTopContainer, #mainContent, #navigationBottomContainer").removeClass("hidden");

		$.scrollify({
	        section: ".step:not(.hidden)"
	    });


	    $.scrollify.instantMove(0);
	    $.scrollify.disable();

	}).fail(function() {
		$("#serviceError").fadeIn();
	});

});
