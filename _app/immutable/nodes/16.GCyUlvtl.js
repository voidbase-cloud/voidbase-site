import{I as e,P as t,bt as n,it as r,nt as i,tt as a}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as o}from"../chunks/BnicrACe.js";import{t as s}from"../chunks/CKGhWLYV.js";import{t as c}from"../chunks/zqPRTk6w.js";import{t as l}from"../chunks/CKC416Ky.js";var u=e(`<!> <!> <p><strong>API Rules</strong> are your collection access controls and data filters.</p> <p>Each collection has <strong>5 rules</strong>, corresponding to the specific API action:</p> <ul><li><code>listRule</code></li> <li><code>viewRule</code></li> <li><code>createRule</code></li> <li><code>updateRule</code></li> <li><code>deleteRule</code></li></ul> <p>Auth collections have an additional <code>options.manageRule</code> used to allow one user (it could be even
    from a different collection) to be able to fully manage the data of another user (ex. changing their email,
    password, etc.).</p> <p>Each rule could be set to:</p> <ul><li><strong>"locked"</strong> - aka. <code>null</code>, which means that the action could be performed
        only by an authorized superuser (<strong>this is the default</strong>)</li> <li><strong>Empty string</strong> - anyone will be able to perform the action (superusers, authorized users
        and guests)</li> <li><strong>Non-empty string</strong> - only users (authorized or not) that satisfy the rule filter expression
        will be able to perform this action</li></ul> <div class="alert alert-info"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p><strong>PocketBase API Rules act also as records filter!</strong> <br/> Or in other words, you could for example allow listing only the "active" records of your collection,
            by using a simple filter expression such as: <code>status = "active"</code> (where "status" is a field defined in your Collection).</p> <p>Because of the above, the API will return 200 empty items response in case a request doesn't
            satisfy a <code>listRule</code>, 400 for unsatisfied <code>createRule</code> and 404 for
            unsatisfied <code>viewRule</code>, <code>updateRule</code> and <code>deleteRule</code>. <br/> All rules will return 403 in case they were "locked" (aka. superuser only) and the request client is
            not a superuser.</p> <p>The API Rules are ignored when the action is performed by an authorized superuser (<strong>superusers can access everything</strong>)!</p></div></div> <!> <p>You can find information about the available fields in your collection API rules tab:</p> <img src="/images/screenshots/collection-rules.png" alt="Collection API Rules filters screenshot" class="screenshot" width="550"/> <p>There is autocomplete to help guide you while typing the rule filter expression, but in general you have
    access to <strong>3 groups of fields</strong>:</p> <ul><li><strong>Your Collection schema fields</strong> <br/> This includes all nested relation fields too, ex. <code>someRelField.status != "pending"</code></li> <li><code><strong>@request.*</strong></code> <br/> Used to access the current request data, such as query parameters, body/form fields, authorized user state,
        etc. <ul><li><code>@request.context</code> - the context where the rule is used (ex. <code>@request.context != "oauth2"</code>) <br/> <small class="txt-hint">The currently supported context values are <code>default</code>, <code>oauth2</code>, <code>otp</code>, <code>password</code>, <code>realtime</code>, <code>protectedFile</code>.</small></li> <li><code>@request.method</code> - the HTTP request method (ex. <code>@request.method = "GET"</code>)</li> <li><code>@request.headers.*</code> - the request headers as string values (ex. <code>@request.headers.x_token = "test"</code>) <br/> <small class="txt-hint">Note: All header keys are normalized to lowercase and "-" is replaced with "_" (for
                    example "X-Token" is "x_token").</small></li> <li><code>@request.query.*</code> - the request query parameters as string values (ex. <code>@request.query.page = "1"</code>)</li> <li><code>@request.auth.*</code> - the current authenticated model (ex. <code>@request.auth.id != ""</code>)</li> <li><code>@request.body.*</code> - the submitted body parameters (ex. <code>@request.body.title != ""</code>) <br/> <small class="txt-hint">Note: Uploaded files are not part of the <code class="txt-sm">@request.body</code> because they are evaluated separately (<em>this behavior may change in the future</em>).</small></li></ul></li> <li><code><strong>@collection.*</strong></code> <p>This filter could be used to target other collections that are not directly related to the current
            one (aka. there is no relation field pointing to it) but both shares a common field value, like
            for example a category id:</p> <!> <p>In case you want to join the same collection multiple times but based on different criteria, you
            can define an alias by appending <code>:alias</code> suffix to the collection name.</p> <!></li></ul> <!> <!> <!> <p>The following datetime macros are available and can be used as part of the filter expression:</p> <!> <p>For example:</p> <!> <!> <p>The <code>:isset</code> field modifier is available only for the <code>@request.*</code> fields and can be
    used to check whether the client submitted a specific data with the request. Here is for example a rule that
    disallows submitting a "role" field:</p> <!> <p><small class="txt-hint">Note that <code class="txt-sm">@request.body.*:isset</code> at the moment doesn't support checking for
        new uploaded files because they are evaluated separately and cannot be serialized (<em>this behavior may change in the future</em>).</small></p> <!> <p>The <code>:changed</code> field modifier is available only for the <code>@request.body.*</code> fields and
    can be used to check whether the client submitted AND changed a specific record field with the request. Here
    is for example a rule that disallows changing a "role" field:</p> <!> <p><small class="txt-hint">Note that <code class="txt-sm">@request.body.*:changed</code> at the moment doesn't support checking
        for new uploaded files because they are evaluated separately and cannot be serialized (<em>this behavior may change in the future</em>).</small></p> <!> <p>The <code>:length</code> field modifier could be used to check the number of items in an array field
    (multiple <code>file</code>, <code>select</code>, <code>relation</code>). <br/> Could be used with both the collection schema fields and the <code>@request.body.*</code> fields. For example:</p> <!> <p><small class="txt-hint">Note that <code class="txt-sm">@request.body.*:length</code> at the moment doesn't support checking
        for new uploaded files because they are evaluated separately and cannot be serialized (<em>this behavior may change in the future</em>).</small></p> <!> <p>The <code>:each</code> field modifier works only with multiple <code>select</code>, <code>file</code> and <code>relation</code> type fields. It could be used to apply a condition on each item from the field array. For example:</p> <!> <p><small class="txt-hint">Note that <code class="txt-sm">@request.body.*:each</code> at the moment doesn't support checking for
        new uploaded files because they are evaluated separately and cannot be serialized (<em>this behavior may change in the future</em>).</small></p> <!> <p>The <code>:lower</code> field modifier could be used to perform lower-case string comparisons. For example:</p> <!> <p><small class="txt-hint">Under the hood it uses the <a href="https://www.sqlite.org/lang_corefunc.html#lower" target="_blank" rel="noopener noreferrer">SQLite <code>LOWER</code> scalar function</a> and by default works only for ASCII characters, unless the ICU extension is loaded.</small></p> <!> <p>The <code>geoDistance(lonA, latA, lonB, latB)</code> function could be used to calculate the Haversine distance
    between 2 geographic points in kilometres.</p> <p>The function is intended to be used primarily with the <code>geoPoint</code> field type, but the accepted
    arguments could be any plain number or collection field identifier. If the identifier cannot be resolved
    and converted to a numeric value, it resolves to <code>null</code>. Note that the <code>geoDistance</code> function always results in a single row/record value meaning that "any/at-least-one-of"
    type of constraint will be applied even if some of its arguments originate from a multiple relation field.</p> <p>For example:</p> <!> <!> <p>The <code>strftime(format, [time-value, modifiers...])</code> returns a date string formatted according to
    the specified format argument.</p> <p>The function is similar to the builtin SQLite <a href="https://sqlite.org/lang_datefunc.html" target="_blank" rel="noopener noreferrer"><code>strftime</code></a> with the main difference that NULL results will be normalized for consistency with the non-nullable PocketBase <code>text</code> and <code>date</code> fields.</p> <p>The function accepts 1, 2 or 3+ arguments.</p> <ol><li>The first (<strong>format</strong>) argument must be a formatting string with valid substitution
        characters as listed in <a href="https://sqlite.org/lang_datefunc.html" target="_blank" rel="noopener noreferrer">https://sqlite.org/lang_datefunc.html</a>.</li> <li>The second (<strong>time-value</strong>) argument is optional and must be either a date <strong>string</strong>, <strong>number</strong> or <strong>collection field identifier</strong> with value matching one of the
        formats listed in <a href="https://sqlite.org/lang_datefunc.html#time_values" target="_blank" rel="noopener noreferrer">https://sqlite.org/lang_datefunc.html#time_values</a>. If not set the function fallbacks to the current datetime.</li> <li>The remaining (<strong>modifiers</strong>) optional arguments are expected to be string literals
        matching the listed modifiers in <a href="https://sqlite.org/lang_datefunc.html#modifiers" target="_blank" rel="noopener noreferrer">https://sqlite.org/lang_datefunc.html#modifiers</a> (up to 8 max).</li></ol> <p>A match-all constraint will be also applied in case the time-value is an identifier as a result of a
    multi-value relation field. For example:</p> <!> <!> <ul><li class="m-b-sm">Allow only registered users: <!></li> <li class="m-b-sm">Allow only registered users and return records that are either "active" or "pending": <!></li> <li class="m-b-sm">Allow only registered users who are listed in an <em>allowed_users</em> multi-relation field value: <!></li> <li class="m-b-sm">Allow access by anyone and return only the records where the <em>title</em> field value starts with
        "Lorem" (ex. "Lorem ipsum"): <!></li></ul>`,1);function d(e){var d=u(),f=i(d);l(f,{});var p=r(f,2);o(p,{title:`API rules`});var m=r(p,16);o(m,{title:`Filters syntax`});var h=r(m,8),g=r(a(h),4),_=r(a(g),4);s(_,{content:`
                @collection.news.categoryId ?= categoryId && @collection.news.author ?= @request.auth.id
            `});var v=r(_,4);s(v,{content:`
                // see https://github.com/pocketbase/pocketbase/discussions/3805#discussioncomment-7634791
                @request.auth.id != "" &&
                @collection.courseRegistrations.user ?= id &&
                @collection.courseRegistrations:auth.user ?= @request.auth.id &&
                @collection.courseRegistrations.courseGroup ?= @collection.courseRegistrations:auth.courseGroup
            `}),n(g),n(h);var y=r(h,2);c(y,{});var b=r(y,2);o(b,{title:`Special identifiers and modifiers`});var x=r(b,2);o(x,{title:`@ macros`,tag:`h5`});var S=r(x,4);s(S,{class:`m-b-0`,language:`html`,content:`
        // all macros are UTC based
        // (for more complex date operation check the strftime() function)
        @now        - the current datetime as string
        @second     - @now second number (0-59)
        @minute     - @now minute number (0-59)
        @hour       - @now hour number (0-23)
        @weekday    - @now weekday number (0-6)
        @day        - @now day number
        @month      - @now month number
        @year       - @now year number
        @yesterday  - the yesterday datetime relative to @now as string
        @tomorrow   - the tomorrow datetime relative to @now as string
        @todayStart - beginning of the current day as datetime string
        @todayEnd   - end of the current day as datetime string
        @monthStart - beginning of the current month as datetime string
        @monthEnd   - end of the current month as datetime string
        @yearStart  - beginning of the current year as datetime string
        @yearEnd    - end of the current year as datetime string
    `});var C=r(S,4);s(C,{content:`@request.body.publicDate >= @now`});var w=r(C,2);o(w,{title:`:isset modifier`,tag:`h5`});var T=r(w,4);s(T,{class:`m-b-0`,content:`
        @request.body.role:isset = false
    `});var E=r(T,4);o(E,{title:`:changed modifier`,tag:`h5`});var D=r(E,4);s(D,{class:`m-b-0`,content:`
        // the same as: (@request.body.role:isset = false || @request.body.role = role)
        @request.body.role:changed = false
    `});var O=r(D,4);o(O,{title:`:length modifier`,tag:`h5`});var k=r(O,4);s(k,{class:`m-b-0`,content:`
        // check example submitted data: {"someSelectField": ["val1", "val2"]}
        @request.body.someSelectField:length > 1

        // check existing record field length
        someRelationField:length = 2
    `});var A=r(k,4);o(A,{title:`:each modifier`,tag:`h5`});var j=r(A,4);s(j,{class:`m-b-0`,content:`
        // check if all submitted select options contain the "create" text
        @request.body.someSelectField:each ~ "create"

        // check if all existing someSelectField has "pb_" prefix
        someSelectField:each ~ "pb_%"
    `});var M=r(j,4);o(M,{title:`:lower modifier`,tag:`h5`});var N=r(M,4);s(N,{class:`m-b-0`,content:`
        // check if the submitted lower-cased body "title" field is equal to "test" ("Test", "tEsT", etc.)
        @request.body.title:lower = "test"

        // match existing records with lower-cased "title" equal to "test" ("Test", "tEsT", etc.)
        title:lower ~ "test"
    `});var P=r(N,4);o(P,{title:`geoDistance(lonA, latA, lonB, latB)`,tag:`h5`});var F=r(P,8);s(F,{class:`m-b-0`,content:`
        // offices that are less than 25km from my location (address is a geoPoint field in the offices collection)
        geoDistance(address.lon, address.lat, 23.32, 42.69) < 25
    `});var I=r(F,2);o(I,{title:`strftime(format, [time-value, modifiers...])`,tag:`h5`});var L=r(I,12);s(L,{class:`m-b-0`,content:`
        // requires ALL multiRel records to have "created" that match the formatted string "2026-01"
        strftime('%Y-%m', multiRel.created) = "2026-01"

        // requires ANY/AT-LEAST-ONE-OF multiRel records to have "created" that match the formatted string "2026-01"
        strftime('%Y-%m', multiRel.created) ?= "2026-01"
    `});var R=r(L,2);o(R,{title:`Examples`});var z=r(R,2),B=a(z),V=r(a(B));s(V,{content:`
                @request.auth.id != ""
            `}),n(B);var H=r(B,2),U=r(a(H));s(U,{content:`
                @request.auth.id != "" && (status = "active" || status = "pending")
            `}),n(H);var W=r(H,2),G=r(a(W),3);s(G,{content:`
                @request.auth.id != "" && allowed_users.id ?= @request.auth.id
            `}),n(W);var K=r(W,2),q=r(a(K),3);s(q,{content:`
                title ~ "Lorem%"
            `}),n(K),n(z),t(e,d)}export{d as component};