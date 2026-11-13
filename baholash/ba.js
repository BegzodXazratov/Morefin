(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.ba').forEach(function(el){
    var r = el.querySelector('input'); var touched = false;
    function set(v){ el.style.setProperty('--p', v + '%'); r.value = v; }
    r.addEventListener('input', function(){ touched = true; set(r.value); });
    set(50);
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(e){
      if (!e[0].isIntersecting) return; io.disconnect();
      var t0 = null;
      (function step(t){
        if (touched) return; if (t0 === null) t0 = t;
        var k = (t - t0) / 3200; if (k > 1) { set(50); return; }
        set(Math.round(50 + 42 * Math.sin(k * Math.PI * 2)));
        requestAnimationFrame(step);
      })(performance.now());
    }, { threshold: .6 });
    io.observe(el);
  });
})();
