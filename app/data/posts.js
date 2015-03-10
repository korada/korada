---
    layout: nil
---
define([],function(){
	return [
    {% for post in site.posts %}
        {
          "title"    : "{{ post.title }}",
          "url"     : "{{ post.url }}",
          "date"     : "{{ post.date | date: "%B %d, %Y" }}"
        } {% if forloop.last %}{% else %},{% endif %}
    {% endfor %} ];
});