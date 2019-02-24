import React from 'react';
var ctx;
function randomDots(x, y) {
  var circle = new Path2D();
  circle.arc(x, y, 1, 0, 2 * Math.PI);
  ctx.fillStyle = "white";
  ctx.fill(circle);
}
export default class Resume extends React.Component {
  
  constructor(props) {
    super(props);

  }

  componentDidMount(){
    var canvas = document.getElementById("resumeCanvas");
    ctx = canvas.getContext("2d");
    ctx.beginPath();
    for (var i = 0; i < 200; i++) {
      var x = Math.floor(Math.random() * canvas.width);
      var y = Math.floor(Math.random() * canvas.height);
      randomDots(x, y);
    }
  }

  render() {
    return (
      <div className="resume">
        <h1>Resume</h1>
        <canvas id="resumeCanvas"></canvas>
      </div>);
  }
}