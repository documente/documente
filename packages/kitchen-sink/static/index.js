const nav = document.querySelector('nav');
const main = document.querySelector('main');

let currentCategoryNavigationContainer = null;

function withinCategory(title, builder) {
  const categoryBanner = document.createElement('div');
  categoryBanner.className = 'category-banner';
  const h2 = document.createElement('h2');
  h2.textContent = title;
  h2.className = 'container';
  categoryBanner.appendChild(h2);
  main.appendChild(categoryBanner);

  const div = document.createElement('div');
  div.className = 'category-navigation';
  const categoryNameDiv = document.createElement('div');
  categoryNameDiv.textContent = title;
  categoryNameDiv.classList.add('category');
  div.appendChild(categoryNameDiv);

  currentCategoryNavigationContainer = div;
  builder();
  currentCategoryNavigationContainer = null;

  nav.appendChild(div);
}

function highlightKeywords(inputString) {
  let resultString = inputString;

  // Strings
  const quoteRegex = /"([^"]*)"/g;
  resultString = resultString.replace(quoteRegex, '<span class="quoted-text">"$1"</span>');

  // Primary keywords
  ['given', 'when', 'then', 'and', 'I', 'should']
      .map(keyword => new RegExp(`\\b${keyword}\\b`, 'gi'))
      .forEach(regex => {
        resultString = resultString.replace(regex, '<span class="keyword">$&</span>');
      });

  // Numbers
  const numberRegex = /(?<!:)\b(\d+)\b/g;
  resultString = resultString.replace(numberRegex, '<span class="number">$1</span>');


  return resultString;
}

function appendSection(title, contentBuilder, snippet = null) {
  if (currentCategoryNavigationContainer == null) {
    throw new Error('No category navigation container.' +
        ' You should call this function inside the withinCategory() builder callback.');
  }

  const section = document.createElement('section');
  section.id = title.toLowerCase().replace(/ /g, '-');
  section.className = 'container';

  const h3 = document.createElement('h3');
  h3.textContent = title;
  section.appendChild(h3);

  if (snippet) {
    const snippetContainer = document.createElement('div');
    snippetContainer.classList.add('snippet');
    snippetContainer.innerHTML = highlightKeywords(snippet
        .replace(/\n/g, '<br>'));
    section.appendChild(snippetContainer);
  }

  section.appendChild(contentBuilder());

  const a = document.createElement('a');
  a.href = '#' + section.id;
  a.textContent = title;
  currentCategoryNavigationContainer.appendChild(a);

  main.appendChild(section);
}

withinCategory('Actions', () => {
  appendSection('Visit', () => document.createElement('div'),
      `When I visit "{{basePath}}/forward.html"
      then forward-header should exist`);

  appendSection('Click', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    const span = document.createElement('span');
    span.id = 'message1';
    span.innerText = 'Clicked!';
    span.style.visibility = 'hidden';

    button.textContent = 'Click me';
    button.id = 'button1';
    button.addEventListener('click', () => {
      span.style.visibility = 'visible';
    });

    container.appendChild(button);
    container.appendChild(span);

    return container;
  }, `Given I visit "{{basePath}}"
  when I click button1
  then message1 should be visible`);

  appendSection('Double-click', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    button.id = 'button2';
    const span = document.createElement('span');
    span.id = 'message2';

    span.innerText = 'Double-clicked!';
    span.style.visibility = 'hidden';

    button.textContent = 'Double-click me';
    button.addEventListener('dblclick', () => {
      span.style.visibility = 'visible';
    });

    container.appendChild(button);
    container.appendChild(span);

    return container;
  }, `Given I visit "{{basePath}}"
  when I double-click button2
  then message2 should be visible`);

  appendSection('Right-click', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    button.id = 'button3';
    const span = document.createElement('span');
    span.id = 'message3';

    span.innerText = 'Right-clicked!';
    span.style.visibility = 'hidden';

    button.textContent = 'Right-click me';
    button.addEventListener('contextmenu', (evt) => {
      span.style.visibility = 'visible';
      evt.preventDefault();
    });

    container.appendChild(button);
    container.appendChild(span);

    return container;
  }, `Given I visit "{{basePath}}"
  when I right-click button3
  then message3 should be visible`);

  appendSection('Type', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.id = 'input1';
    container.appendChild(input);
    return container;
  }, `Given I visit "{{basePath}}"
  when I type "Some text" into input1
  then it should have value "Some text"`);

  appendSection('Clear', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.id = 'input2';
    input.value = 'Some text';
    container.appendChild(input);
    return container;
  }, `Given I visit "{{basePath}}"
  when I clear input2
  then it should have value ""`);

  appendSection('Check', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    const span = document.createElement('span');
    span.id = 'message4';
    span.innerText = 'Unchecked';
    input.id = 'checkbox1';
    input.type = 'checkbox';
    input.addEventListener('change', (evt) => {
      console.log('change', evt.target.checked);
      span.innerText = evt.target.checked ? 'Checked' : 'Unchecked';
    });
    container.appendChild(input);
    container.appendChild(span);
    return container;
  }, `Given I visit "{{basePath}}"
  when I check checkbox1
  then message4 should have text "Checked"`);

  appendSection('Uncheck', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    const span = document.createElement('span');
    span.id = 'message5';
    span.innerText = 'Checked';
    input.id = 'checkbox2';
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', (evt) => {
      span.innerText = evt.target.checked ? 'Checked' : 'Unchecked';
    });
    container.appendChild(input);
    container.appendChild(span);
    return container;
  }, `Given I visit "{{basePath}}"
  when I uncheck checkbox2
  then message5 should have text "Unchecked"`);

  appendSection('Scroll', () => {
    const container = document.createElement('div');
    const div = document.createElement('div');
    div.style.height = '300px';
    div.style.width = '300px';
    div.style.overflow = 'scroll';
    div.style.border = '1px solid #ccc';
    div.style.padding = '1rem';
    div.style.boxSizing = 'border-box';

    const element = document.createElement('div');
    element.id = 'scroll-element';
    element.innerText = 'Scroll me into view!';
    element.style.display = 'inline-block';
    element.style.backgroundColor = '#b3e5ee';
    element.style.position = 'relative';
    element.style.left = '1000px';
    element.style.top = '700px';
    element.style.padding = '5px';

    div.appendChild(element);
    container.appendChild(div);
    return container;
  }, `Given I visit "{{basePath}}"
  when I scroll to scroll-element
  then it should be visible`);

  appendSection('Select', () => {
    const container = document.createElement('div');
    const select = document.createElement('select');
    select.id = 'select1';
    const option1 = document.createElement('option');
    const option2 = document.createElement('option');
    const option3 = document.createElement('option');
    option1.value = '1';
    option1.innerText = 'Option 1';
    option2.value = '2';
    option2.innerText = 'Option 2';
    option3.value = '3';
    option3.innerText = 'Option 3';
    select.appendChild(option1);
    select.appendChild(option2);
    select.appendChild(option3);
    container.appendChild(select);

    const span = document.createElement('span');
    span.id = 'message6';
    span.innerText = 'Selected: ';
    container.appendChild(span);

    select.addEventListener('change', (evt) => {
      span.innerText = 'Selected: ' + evt.target.value;
    });

    return container;
  }, `Given I visit "{{basePath}}"
  when I select "Option 2" in select1
  then message6 should have text "Selected: 2"`);

  appendSection('Go back', () => {
    const container = document.createElement('div');
    const a = document.createElement('a');
    a.id = 'forward-link1';
    a.href = 'forward.html';
    a.innerText = 'Go to next page';
    container.appendChild(a);
    return container;
  }, `Given I visit "{{basePath}}"
  when I click forward-link1
  and I go back
  then home-header should exist`);

  appendSection('Go forward', () => {
    const container = document.createElement('div');
    const a = document.createElement('a');
    a.id = 'forward-link2';
    a.href = 'forward.html';
    a.innerText = 'Go to next page';
    container.appendChild(a);
    return container;
  }, `Given I visit "{{basePath}}"
  when I click forward-link2
  and I go back
  and I go forward
  then forward-header should exist`);
});

withinCategory('Assertions', () => {
  appendSection('Have text', () => {
    const container = document.createElement('div');
    const span = document.createElement('span');
    span.id = 'span1';
    span.innerText = 'Hello, Documenté!';
    container.appendChild(span);
    return container;
  }, `When I visit "{{basePath}}"
  then span1 should have text "Hello, Documenté!"`);

  appendSection('Be visible', () => {
    const container = document.createElement('div');
    const div = document.createElement('div');
    div.id = 'div1';
    div.style.backgroundColor = '#b3e5ee';
    div.style.padding = '1rem';
    div.innerText = 'I should be visible.';
    container.appendChild(div);
    return container;
  }, `When I visit "{{basePath}}"
  then div1 should be visible`);

  appendSection('Be hidden', () => {
    const container = document.createElement('div');
    const div = document.createElement('div');
    div.id = 'hidden-div';
    div.style.visibility = 'hidden';
    div.style.padding = '1rem';
    div.innerText = "I'm hidden.";
    container.appendChild(div);
    return container;
  }, `When I visit "{{basePath}}"
  then hidden-div should be hidden`);

  appendSection('Contain text', () => {
    const container = document.createElement('div');
    const div = document.createElement('div');
    div.id = 'div2';
    div.style.backgroundColor = '#b3e5ee';
    div.style.padding = '1rem';
    div.innerText = 'I contain the following text: "Hello, Documenté!"';
    container.appendChild(div);
    return container;
  }, `When I visit "{{basePath}}"
  then div2 should contain text "Hello, Documenté!"`);

  appendSection('Have value', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.id = 'input3';
    input.value = 'Hello, Documenté!';
    container.appendChild(input);
    return container;
  }, `When I visit "{{basePath}}"
  then input3 should have value "Hello, Documenté!"`);

  appendSection('Have class', () => {
    const container = document.createElement('div');
    const div = document.createElement('div');
    div.id = 'div3';
    div.className = 'foo';
    div.innerText = 'I have class "foo"';
    container.appendChild(div);
    return container;
  }, `When I visit "{{basePath}}"
  then div3 should have class "foo"`);

  appendSection('Exist', () => {
    const container = document.createElement('div');
    const div = document.createElement('div');
    div.id = 'div4';
    div.innerText = 'I exist!';
    container.appendChild(div);
    return container;
  }, `When I visit "{{basePath}}"
  then div4 should exist`);

  appendSection('Not exist', () => {
    return document.createElement('div');
  }, `When I visit "{{basePath}}"
  then non-existent element should not exist`);

  appendSection('Be checked', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.id = 'checkbox3';
    input.type = 'checkbox';
    input.checked = true;
    container.appendChild(input);
    return container;
  }, `When I visit "{{basePath}}"
  then checkbox3 should be checked`);

  appendSection('Be unchecked', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.id = 'checkbox4';
    input.type = 'checkbox';
    container.appendChild(input);
    return container;
  }, `When I visit "{{basePath}}"
  then checkbox4 should be unchecked`);

  appendSection('Be disabled', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.id = 'input4';
    input.disabled = true;
    container.appendChild(input);
    return container;
  }, `When I visit "{{basePath}}"
  then input4 should be disabled`);

  appendSection('Be enabled', () => {
    const container = document.createElement('div');
    const input = document.createElement('input');
    input.id = 'input5';
    container.appendChild(input);
    return container;
  }, `When I visit "{{basePath}}"
  then input5 should be enabled`);

  appendSection('Have occurrences', () => {
    const container = document.createElement('div');
    for (let i = 0; i < 4; i++) {
      const div = document.createElement('div');
      div.className = 'multi-element';
      div.innerText = `Element ${i}`;
      container.appendChild(div);
    }
    return container;
  }, `When I visit "{{basePath}}"
  then multi-element should have 4 occurrences`);
});
