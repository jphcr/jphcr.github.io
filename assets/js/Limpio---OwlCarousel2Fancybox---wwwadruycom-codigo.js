// JavaScript Document

function comprueboSiExiste($itemElegido/*Que objeto elegido*/){ 
	var $existencia=false;
	if ( $($itemElegido).length ) {//Comruebo si existe el item elegido
		$existencia=true;
	}//if
 	return $existencia; 
};

function inicioFancyboxSiExiste ($itemElegido/*Que objeto elegido*/){
	var existe = comprueboSiExiste($itemElegido);
	//alert (vaca);
	if (existe){ //esto es lo mismo que if (existe==true)
		//alert ("Existe Pop UP");
		$($itemElegido).fancybox({
			openEffect: "none",
			closeEffect: "none",
			padding: 0,
			helpers     : {
				title: {
					type: 'inside'
				},//title
				overlay: {
				  locked: false
				}//overlay
			}//helpers
		}); //fancybox
	}//if
};//function

function inicioCarouselSiExiste ($itemElegido/*Que objeto elegido*/){
	var existe = comprueboSiExiste($itemElegido);
	//alert (vaca);
	if (existe){ //esto es lo mismo que if (existe==true)
		//alert ("Existe Pop UP");
		/*$($itemElegido).owlCarousel({
			autoPlay: 8000,
			lazyLoad : true,
			scrollPerPage: true,
			navigation : true,
			items : 4,
			itemsDesktop : [1199,3],
			itemsDesktopSmall : [979,3]
		});//owlCarousel*/
		
		var owl = $($itemElegido);
 
		owl.owlCarousel({
			autoPlay: 8000,
			lazyLoad : true,
			scrollPerPage: true,
			navigation:false,
			/*navigationText: [
			  "<img class='pull-right icon-chevron-left' src='img/slider/galeria/flechaIzqADR2.png' alt=''/>",
			  "<img class='pull-left icon-chevron-right' src='img/slider/galeria/flechaDerADR2.png' alt=''/>"
			  ],*/
			items : 4,
			itemsDesktop : [1199,3],
			itemsDesktopSmall : [979,3]
		});
		 
		  // Custom Navigation Events
		  $(".owl-next").click(function(){
			owl.trigger('owl.next');
		  })
		  $(".owl-prev").click(function(){
			owl.trigger('owl.prev');
		  })
}//if
};//function


inicioFancyboxSiExiste (".fancybox");
inicioCarouselSiExiste ("#owl-demo");

