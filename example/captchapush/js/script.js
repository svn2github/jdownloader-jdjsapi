/**
 * CaptchaPush for JDownloader
 * 
 * @author mhils
 */

isPhoneGap = false; // Perform several adjustments for mobile platforms

document.addEventListener("deviceready", onPhoneGap, false);

function onPhoneGap() {
	isPhoneGap = true;
	$("#sound").attr("checked", "checked").parents("tr").hide();
}

$(function CaptchaPush() {

	initComplete = false;
	/*
	 * Needed for the history plugin. The callback function will get triggered
	 * 1-2 times (depending on browser) on init, we don't change anything in
	 * these cases.
	 */

	var CaptchaHandler = {
		_queue : [],
		addCaptcha : function addCaptcha(captcha) {
			CaptchaHandler._queue.push(captcha);
			if (CaptchaHandler._queue.length == 1) {
				CaptchaHandler.showNext();
			}
		},
		showNext : function showNext() {
			$("#captcha img").attr("src", $.jd.getURL("captcha/get", CaptchaHandler._queue[0].captchaID));
			notifyUser();
			$("#captcha #display").slideDown();
			$("#captchaInput").val("").focus();
		},
		solve : function solve() {
			$.jd.send("captcha/solve", [ CaptchaHandler._queue.shift().captchaID, $("#captchaInput").val() ]);
			$("#captcha #display").slideUp();
			if (CaptchaHandler._queue.length > 0)
				CaptchaHandler.showNext();
		}
	};

	function setStatus(status) {
		console.log(status);
		if (status == "")
			status = "&nbsp;";
		$("#status").html(status);
	}

	function onConnect(resp) {
		console.log(resp);
		// FIXME Error handling
		$("#auth .do").attr("disabled", null);
		setStatus("Connection etablished.");
		if ($.webStorage.local().getItem("autologin") === true) {
			$("#auth .do").click();
		}

	}
	;

	function onAuth(resp) {
		console.log(resp);

		if (resp.status == $.jd.e.sessionStatus.REGISTERED) {
			// Save config in localStorage
			setStatus("Waiting for Captchas!");
			if ($("#remember").is(':checked')) {
				$.each(settingIds, function(i, a) {
					o = $("#" + a);
					if (o.is('[type="checkbox"]')) {
						var isChecked = (o.attr("checked") === "checked");
						$.webStorage.local().setItem(a, isChecked);
					} else
						$.webStorage.local().setItem(a, o.val());
				});
			} else {
				$.each(settingIds, function(i, a) {
					$.webStorage.local().removeItem(a);
				});
			}
			
			$.jd.setOptions({
				debug: true,
				onmessage : onEvent
			});
			$.jd.startPolling();
		} else {
			window.history.back();
			setStatus("Authentication failed!");
		}
	}
	;

	function notifyUser() {
		if (isPhoneGap) {
			navigator.notification.vibrate(1000);
			navigator.notification.beep(1);
		} else {
			if ($("#sound").is(":checked"))
				captchaSound.play();
		}
	}

	function onEvent(event) {
		console.log(event);
		if (event.module === "captcha" && event.type === "new") {
			CaptchaHandler.addCaptcha(event.data);
		}
	}

	$("#connect .do").click(function() {

		setStatus("Connecting...");
		$.jd.setOptions({
			apiServer : $("#apiurl").val(),
			debug: true//,
			//apiTimeout : 1000
		}).send('jd/getVersion', onConnect);
		$("#auth .do").attr("disabled", "disabled");
	});

	$("#auth .do").click(function() {
		$.jd.stopSession();
		setStatus("Authenticating...");
		$.jd.setOptions({
			user : $("#user").val(),
			pass : $("#pass").val()
		}).startSession(onAuth);
	});

	$("#captcha .solve").click(CaptchaHandler.solve);

	$("#remember").click(function(e) {
		$("#autologin").parent().parent().toggle();
		if (!$("#remember").is(":checked"))
			$("#autologin").removeAttr("checked");
	});

	$(".back").click(function() {
		$.jd.stopSession(); // our only rollback
		window.history.back();
		setStatus("");
		return false;
	});

	$(".do").click(function() {
		// Regular <a href> links would work great, but we extend browser
		// support this way (see history plugin limitations)
		$.history.load($(this).data("href"));
	});

	function hashChanged(hash) {
		if (!initComplete)
			return;
		if (hash === "")
			hash = "connect";
		console.log("hashChanged: " + hash);
		var off = $(".active");
		var on = $("#" + hash);
		if (!on.is(off)) {
			on.addClass("active");
			// We have to do this right now because
			// execution in the callback may lead to
			// sync errors
			off.removeClass("active").stop(true, true).slideToggle(function() {
				// TODO: Is stop(true) correct?
				on.slideToggle();
			});
		}
	}

	window.location.hash = "";
	$.history.init(hashChanged);

	var settingIds = [ "user", "pass", "remember", "autologin", "apiurl", "sound" ];

	// Restore settings from localStore
	$.each(settingIds, function(i, a) {
		var o = $("#" + a);
		if (o.is('[type="checkbox"]'))
		{
			if ($.webStorage.local().getItem(a) === true)
				o.click();
		}
		else if ($.webStorage.local().getItem(a))
				o.val($.webStorage.local().getItem(a));
	});

	/*
	 * Chrome 14 does not handle a quick change of the location.hash correctly,
	 * which results in invalid back buttons. Workaround replaces back button
	 * functionality and removes autologin key in the localStorage
	 */
	if ($.browser.webkit === true) {
		$(".back").unbind("click").click(function() {
			$.webStorage.local().removeItem("autologin");
			location.reload();
		});
	}

	captchaSound = new buzz.sound("./sounds/captcha", {
		formats : [ "ogg", "mp3" ],
		preload : true,
		autoplay : false,
		loop : false
	});

	var isMobile = navigator.userAgent.match(/iPad|iPhone|android|symian|maemo|meego|webos|phone|mobile/i);
	if (isMobile) {
		// Increase performance by diabling jquery effects
		$.fx.off = true;
	}

	setStatus("");
	initComplete = true;

	if ($.webStorage.local().getItem("autologin"))
		$("#connect .do").click();
});