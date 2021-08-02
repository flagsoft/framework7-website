"use strict";

exports.__esModule = true;
exports.default = void 0;

var _dom = _interopRequireDefault(require("../../shared/dom7"));

var _utils = require("../../shared/utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function swipePanel(panel) {
  var app = panel.app;

  if (panel.swipeInitialized) {
    return;
  }

  (0, _utils.extend)(panel, {
    swipeable: true,
    swipeInitialized: true
  });
  var params = panel.params;
  var $el = panel.$el,
      $backdropEl = panel.$backdropEl,
      side = panel.side,
      effect = panel.effect;
  var otherPanel;
  var isTouched;
  var isGestureStarted;
  var isMoved;
  var isScrolling;
  var isInterrupted;
  var touchesStart = {};
  var touchStartTime;
  var touchesDiff;
  var translate;
  var backdropOpacity;
  var panelWidth;
  var direction;
  var $viewEl;
  var touchMoves = 0;

  function handleTouchStart(e) {
    if (!panel.swipeable || isGestureStarted) return;
    if (!app.panel.allowOpen || !params.swipe && !params.swipeOnlyClose || isTouched) return;
    if ((0, _dom.default)('.modal-in:not(.toast):not(.notification), .photo-browser-in').length > 0) return;
    otherPanel = app.panel.get(side === 'left' ? 'right' : 'left') || {};
    var otherPanelOpened = otherPanel.opened && otherPanel.$el && !otherPanel.$el.hasClass('panel-in-breakpoint');

    if (!panel.opened && otherPanelOpened) {
      return;
    }

    if (!params.swipeOnlyClose) {
      if (otherPanelOpened) return;
    }

    if (e.target && e.target.nodeName.toLowerCase() === 'input' && e.target.type === 'range') return;
    if ((0, _dom.default)(e.target).closest('.range-slider, .tabs-swipeable-wrap, .calendar-months, .no-swipe-panel, .card-opened').length > 0) return;
    touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
    touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;

    if (params.swipeOnlyClose && !panel.opened) {
      return;
    }

    if (params.swipeActiveArea && !panel.opened) {
      if (side === 'left') {
        if (touchesStart.x > params.swipeActiveArea) return;
      }

      if (side === 'right') {
        if (touchesStart.x < app.width - params.swipeActiveArea) return;
      }
    }

    touchMoves = 0;
    $viewEl = (0, _dom.default)(panel.getViewEl());
    isMoved = false;
    isTouched = true;
    isScrolling = undefined;
    isInterrupted = false;
    touchStartTime = (0, _utils.now)();
    direction = undefined;
  }

  function handleTouchMove(e) {
    if (!isTouched || isGestureStarted || isInterrupted) return;
    touchMoves += 1;
    if (touchMoves < 2) return;

    if (e.f7PreventSwipePanel || app.preventSwipePanelBySwipeBack || app.preventSwipePanel) {
      isTouched = false;
      return;
    }

    var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
    var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

    if (typeof isScrolling === 'undefined') {
      isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
    }

    if (isScrolling) {
      isTouched = false;
      return;
    }

    if (!direction) {
      if (pageX > touchesStart.x) {
        direction = 'to-right';
      } else {
        direction = 'to-left';
      }

      if (params.swipeActiveArea > 0 && !panel.opened) {
        if (side === 'left' && touchesStart.x > params.swipeActiveArea) {
          isTouched = false;
          return;
        }

        if (side === 'right' && touchesStart.x < app.width - params.swipeActiveArea) {
          isTouched = false;
          return;
        }
      }

      if ($el.hasClass('panel-in-breakpoint')) {
        isTouched = false;
        return;
      }

      if (side === 'left' && direction === 'to-left' && !$el.hasClass('panel-in') || side === 'right' && direction === 'to-right' && !$el.hasClass('panel-in')) {
        isTouched = false;
        return;
      }
    }

    var threshold = panel.opened ? 0 : -params.swipeThreshold;
    if (side === 'right') threshold = -threshold;

    if (!isMoved) {
      if (!panel.opened) {
        panel.insertToRoot();
        $el.addClass('panel-in-swipe');
        $backdropEl.css('visibility', 'visible');
        $el.trigger('panel:swipeopen');
        panel.emit('local::swipeOpen panelSwipeOpen', panel);
      }

      panelWidth = $el[0].offsetWidth;

      if (effect === 'reveal' && $el.hasClass('panel-in-collapsed')) {
        panelWidth -= parseFloat($viewEl.css("margin-" + side));
      }

      $el.transition(0);
    }

    isMoved = true;

    if (e.cancelable) {
      e.preventDefault();
    }

    touchesDiff = pageX - touchesStart.x + threshold;

    if (side === 'right') {
      if (effect === 'cover' || effect === 'push') {
        translate = touchesDiff + (panel.opened ? 0 : panelWidth);
        if (translate < 0) translate = 0;

        if (translate > panelWidth) {
          translate = panelWidth;
        }
      } else {
        translate = touchesDiff - (panel.opened ? panelWidth : 0);
        if (translate > 0) translate = 0;

        if (translate < -panelWidth) {
          translate = -panelWidth;
        }
      }
    } else {
      translate = touchesDiff + (panel.opened ? panelWidth : 0);
      if (translate < 0) translate = 0;

      if (translate > panelWidth) {
        translate = panelWidth;
      }
    }

    var noFollowProgress = Math.abs(translate / panelWidth);

    if (effect === 'reveal') {
      if (!params.swipeNoFollow) {
        $viewEl.transform("translate3d(" + translate + "px,0,0)").transition(0);
        $backdropEl.transform("translate3d(" + translate + "px,0,0)").transition(0);
      }

      $el.trigger('panel:swipe', Math.abs(translate / panelWidth));
      panel.emit('local::swipe panelSwipe', panel, Math.abs(translate / panelWidth));
    } else {
      if (side === 'left') translate -= panelWidth;

      if (!params.swipeNoFollow) {
        $backdropEl.transition(0);
        backdropOpacity = 1 - Math.abs(translate / panelWidth);
        $backdropEl.css({
          opacity: backdropOpacity
        });
        $el.transform("translate3d(" + translate + "px,0,0)").transition(0);

        if (effect === 'push') {
          var viewTranslate = side === 'left' ? translate + panelWidth : translate - panelWidth;
          $viewEl.transform("translate3d(" + viewTranslate + "px,0,0)").transition(0);
          $backdropEl.transform("translate3d(" + viewTranslate + "px,0,0)").transition(0);
        }
      }

      $el.trigger('panel:swipe', Math.abs(translate / panelWidth));
      panel.emit('local::swipe panelSwipe', panel, Math.abs(translate / panelWidth));
    }

    if (params.swipeNoFollow) {
      var stateChanged = panel.opened && noFollowProgress === 0 || !panel.opened && noFollowProgress === 1;

      if (stateChanged) {
        isInterrupted = true; // eslint-disable-next-line

        handleTouchEnd(e);
      }
    }
  }

  function handleTouchEnd(e) {
    if (!isTouched || !isMoved) {
      isTouched = false;
      isMoved = false;
      return;
    }

    var isGesture = e.type === 'gesturestart' || isGestureStarted;
    isTouched = false;
    isMoved = false;
    var timeDiff = new Date().getTime() - touchStartTime;
    var action;
    var edge = (translate === 0 || Math.abs(translate) === panelWidth) && !params.swipeNoFollow;
    var threshold = params.swipeThreshold || 0;

    if (isGesture) {
      action = 'reset';
    } else if (!panel.opened) {
      if (Math.abs(touchesDiff) < threshold) {
        action = 'reset';
      } else if (effect === 'cover' || effect === 'push') {
        if (translate === 0) {
          action = 'swap'; // open
        } else if (timeDiff < 300 && Math.abs(translate) > 0) {
          action = 'swap'; // open
        } else if (timeDiff >= 300 && Math.abs(translate) < panelWidth / 2) {
          action = 'swap'; // open
        } else {
          action = 'reset'; // close
        }
      } else if (translate === 0) {
        action = 'reset';
      } else if (timeDiff < 300 && Math.abs(translate) > 0 || timeDiff >= 300 && Math.abs(translate) >= panelWidth / 2) {
        action = 'swap';
      } else {
        action = 'reset';
      }
    } else if (effect === 'cover' || effect === 'push') {
      if (translate === 0) {
        action = 'reset'; // open
      } else if (timeDiff < 300 && Math.abs(translate) > 0) {
        action = 'swap'; // open
      } else if (timeDiff >= 300 && Math.abs(translate) < panelWidth / 2) {
        action = 'reset'; // open
      } else {
        action = 'swap'; // close
      }
    } else if (translate === -panelWidth) {
      action = 'reset';
    } else if (timeDiff < 300 && Math.abs(translate) >= 0 || timeDiff >= 300 && Math.abs(translate) <= panelWidth / 2) {
      if (side === 'left' && translate === panelWidth) action = 'reset';else action = 'swap';
    } else {
      action = 'reset';
    }

    if (action === 'swap') {
      if (panel.opened) {
        panel.close(!edge);
      } else {
        panel.open(!edge);
      }
    }

    var removePanelInClass = true;

    if (action === 'reset') {
      if (!panel.opened) {
        if (edge) {
          // edge position
          $el.removeClass('panel-in-swipe');
        } else {
          removePanelInClass = false;
          var target = effect === 'reveal' ? $viewEl : $el;
          panel.setStateClasses('before-closing');
          target.transitionEnd(function () {
            if ($el.hasClass('panel-in')) return;
            $el.removeClass('panel-in-swipe');
            panel.setStateClasses('after-closing');
          });
        }
      }
    }

    if (effect === 'reveal' || effect === 'push') {
      (0, _utils.nextFrame)(function () {
        $viewEl.transition('');
        $viewEl.transform('');
      });
    }

    if (removePanelInClass) {
      $el.removeClass('panel-in-swipe');
    }

    $el.transition('').transform('');
    $backdropEl.transform('').transition('').css({
      opacity: '',
      visibility: ''
    });
  }

  function handleGestureStart(e) {
    isGestureStarted = true;
    handleTouchEnd(e);
  }

  function handleGestureEnd() {
    isGestureStarted = false;
  } // Add Events


  app.on('touchstart:passive', handleTouchStart);
  app.on('touchmove:active', handleTouchMove);
  app.on('touchend:passive', handleTouchEnd);
  app.on('gesturestart', handleGestureStart);
  app.on('gestureend', handleGestureEnd);
  panel.on('panelDestroy', function () {
    app.off('touchstart:passive', handleTouchStart);
    app.off('touchmove:active', handleTouchMove);
    app.off('touchend:passive', handleTouchEnd);
    app.off('gesturestart', handleGestureStart);
    app.off('gestureend', handleGestureEnd);
  });
}

var _default = swipePanel;
exports.default = _default;