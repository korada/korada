---
    layout: nil
---
define([],function(){
	return [

<<<<<<< HEAD:app/data/posts.js
=======
functionCall({
    "posts":[
>>>>>>> origin/master:data/site.json
    {% for post in site.posts %}
        {
          "title"    : "{{ post.title }}",
          "url"     : "{{ post.url }}",
          "date"     : "{{ post.date | date: "%B %d, %Y" }}"
        } {% if forloop.last %}{% else %},{% endif %}
<<<<<<< HEAD:app/data/posts.js
    {% endfor %} ];
});
=======
    {% endfor %}
]}); 
>>>>>>> origin/master:data/site.json
