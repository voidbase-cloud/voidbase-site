import{I as e,P as t,it as n,nt as r,yt as i}from"../chunks/BDLcFjNi.js";import"../chunks/xihTtKlq.js";import"../chunks/C3kXMaAy.js";import{t as a}from"../chunks/BnicrACe.js";import{t as o}from"../chunks/CfPCrhHi.js";import{t as s}from"../chunks/VQa_QBsN.js";import{t as c}from"../chunks/CKC416Ky.js";var l=e(`<!> <!> <p>To upload files, you must first add a <code>file</code> field to your collection:</p> <img src="/images/screenshots/file-field.png" alt="File field screenshot" width="465" class="screenshot"/> <p>Once added, you could create/update a Record and upload "documents" files by sending a <code>multipart/form-data</code> request using the <em>Records create/update APIs</em>.</p> <div class="alert alert-info m-t-xs m-b-xs"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>Each uploaded file will be stored with the original filename (sanitized) and suffixed with a
            random part (usually 10 characters). For example <code>test_52iwbgds7l.png</code>.</p> <p>All <code>file</code> fields by default has a max allowed file size up to <strong>~5MB</strong> <em>(you can adjust it from the collection field options but keep in mind that allowing to upload
                and serve large files could degrade the performance of your application)</em>.</p></div></div> <p>Here is an example how to create a new record and upload multiple files to the example "documents" <code>file</code> field using the SDKs:</p> <!> <p>If your <code>file</code> field supports uploading multiple files (aka. <strong>Max Files option is >= 2</strong>) you can use the <code>+</code> prefix/suffix field name modifier
    to respectively prepend/append new files alongside the already uploaded ones. For example:</p> <!> <!> <p>To delete uploaded file(s), you could either edit the Record from the Dashboard, or use the API and set
    the file field to a zero-value <br/> (empty string, <code>[]</code>).</p> <p>If you want to <strong>delete individual file(s) from a multiple file upload field</strong>, you could
    suffix the field name with <code>-</code> and specify the filename(s) you want to delete. Here are some examples
    using the SDKs:</p> <!> <p>The above examples use the JSON object data format, but you could also use <code>FormData</code> instance
    for <em>multipart/form-data</em> requests. If using <code>FormData</code> set the file field to an empty string.</p> <!> <p>Each uploaded file could be accessed by requesting its file url: <br/> <code class="txt-bold">http://127.0.0.1:8090/api/files/<span class="txt-danger">COLLECTION_ID_OR_NAME</span>/<span class="txt-info">RECORD_ID</span>/<span class="txt-success">FILENAME</span></code></p> <p>If your file field has the <strong>Thumb sizes</strong> option, you can get a thumb of the image file by
    adding the <code>thumb</code> query parameter to the url like this: <code>http://127.0.0.1:8090/api/files/<span class="txt-danger">COLLECTION_ID_OR_NAME</span>/<span class="txt-info">RECORD_ID</span>/<span class="txt-success">FILENAME</span><strong>?thumb=100x300</strong></code> <br/> <em>Currently limited to jpg, png, gif (its first frame) and partially webp (stored as png).</em></p> <!> <p class="txt-hint">The original file would be returned, if the requested thumb size is not found or the file is not an image!</p> <p>If you already have a Record model instance, the SDKs provide a convenient method to generate a file url
    by its name.</p> <!> <p>Additionally, to instruct the browser to always download the file instead of showing a preview when
    accessed directly, you can append the <code>?download=1</code> query parameter to the file url.</p> <!> <p>By default all files are publicly accessible if you know their full url.</p> <p>For most applications this is fine and reasonably safe because all files have a random part appended to
    their name, but in some cases you may want an extra security to prevent unauthorized access to sensitive
    files like ID card or Passport copies, contracts, etc.</p> <p>To do this you can mark the <code>file</code> field as <em>Protected</em> from its field options in the
    Dashboard and then request the file with a special <strong>short-lived file token</strong>.</p> <div class="alert alert-info m-t-xs m-b-sm"><div class="icon"><i class="ri-information-line"></i></div> <div class="content"><p>Only requests that satisfy the <strong>View API rule</strong> of the record collection will be able
            to access or download the protected file(s).</p> <p>The file token is used to populate the <code>@request.auth.*</code> filter fields and it could be optional depending on your View API rule.
            For example, if a View API rule is an empty string then anyone will have access to the file even when there is no file token.</p></div></div> <!> <!> <p>By default PocketBase stores uploaded files in the <code>pb_data/storage</code> directory on the local file
    system. For the majority of cases this is usually the recommended storage option because it is very fast, easy
    to work with and backup.</p> <p>But if you have limited disk space you could switch to an external S3 compatible storage (AWS S3, MinIO,
    Wasabi, DigitalOcean Spaces, Vultr Object Storage, etc.). The easiest way to set up the connection
    settings is from the <em>Dashboard</em> > <em>Settings</em> > <em>Files storage</em>:</p> <img src="/images/screenshots/files-storage.png" alt="Files storage settings screenshot" class="screenshot"/>`,1);function u(e){var u=l(),d=r(u);c(d,{});var f=n(d,2);a(f,{title:`Uploading files`});var p=n(f,12);o(p,{class:`m-b-xs`,js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        // create a new record and upload multiple files
        // (files must be Blob or File instances)
        const createdRecord = await pb.collection('example').create({
            title: 'Hello world!', // regular text field
            'documents': [
                new File(['content 1...'], 'file1.txt'),
                new File(['content 2...'], 'file2.txt'),
            ]
        });

        // -----------------------------------------------------------
        // Alternative FormData + plain HTML file input example
        // <input type="file" id="fileInput" />
        // -----------------------------------------------------------

        const fileInput = document.getElementById('fileInput');

        const formData = new FormData();

        // set regular text field
        formData.append('title', 'Hello world!');

        // listen to file input changes and add the selected files to the form data
        fileInput.addEventListener('change', function () {
            for (let file of fileInput.files) {
                formData.append('documents', file);
            }
        });

        ...

        // upload and create new record
        const createdRecord = await pb.collection('example').create(formData);
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';
        import 'package:http/http.dart' as http;

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        // create a new record and upload multiple files
        final record = await pb.collection('example').create(
            body: {
                'title': 'Hello world!', // regular text field
            },
            files: [
                http.MultipartFile.fromString(
                    'documents',
                    'example content 1...',
                    filename: 'file1.txt',
                ),
                http.MultipartFile.fromString(
                    'documents',
                    'example content 2...',
                    filename: 'file2.txt',
                ),
            ],
        );
    `});var m=n(p,4);o(m,{class:`m-b-xs`,js:`

        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        const createdRecord = await pb.collection('example').update('RECORD_ID', {
            "documents+": new File(["content 3..."], "file3.txt")
        });
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';
        import 'package:http/http.dart' as http;

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        final record = await pb.collection('example').update(
            'RECORD_ID',
            files: [
                http.MultipartFile.fromString(
                    'documents+',
                    'example content 3...',
                    filename: 'file3.txt',
                ),
            ],
        );
    `});var h=n(m,2);a(h,{title:`Deleting files`});var g=n(h,6);o(g,{js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        // delete all "documents" files
        await pb.collection('example').update('RECORD_ID', {
            'documents': [],
        });

        // delete individual files
        await pb.collection('example').update('RECORD_ID', {
            'documents-': ["file1.pdf", "file2.txt"],
        });
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        // delete all "documents" files
        await pb.collection('example').update('RECORD_ID', body: {
            'documents': [],
        });

        // delete individual files
        await pb.collection('example').update('RECORD_ID', body: {
            'documents-': ["file1.pdf", "file2.txt"],
        });
    `});var _=n(g,4);a(_,{title:`File URL`});var v=n(_,6);s(v,{});var y=n(v,6);o(y,{class:`m-t-10 m-b-xs`,js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        const record = await pb.collection('example').getOne('RECORD_ID');

        // get only the first filename from "documents"
        //
        // note:
        // "documents" is an array of filenames because
        // the "documents" field was created with "Max Files" option > 1;
        // if "Max Files" was 1, then the result property would be just a string
        const firstFilename = record.documents[0];

        // returns something like:
        // http://127.0.0.1:8090/api/files/example/kfzjt5oy8r34hvn/test_52iWbGinWd.png?thumb=100x250
        const url = pb.files.getURL(record, firstFilename, {'thumb': '100x250'});
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        final record = await pb.collection('example').getOne('RECORD_ID');

        // get only the first filename from "documents"
        //
        // note:
        // "documents" is an array of filenames because
        // the "documents" field was created with "Max Files" option > 1;
        // if "Max Files" was 1, then the result property would be just a string
        final firstFilename = record.getListValue<String>('documents')[0];

        // returns something like:
        // http://127.0.0.1:8090/api/files/example/kfzjt5oy8r34hvn/test_52iWbGinWd.png?thumb=100x250
        final url = pb.files.getURL(record, firstFilename, thumb: '100x250');
    `});var b=n(y,4);a(b,{title:`Protected files`});var x=n(b,10);o(x,{js:`
        import PocketBase from 'pocketbase';

        const pb = new PocketBase('http://127.0.0.1:8090');

        ...

        // authenticate
        await pb.collection('users').authWithPassword('test@example.com', '1234567890');

        // generate a file token
        const fileToken = await pb.files.getToken();

        // retrieve an example protected file url (will be valid ~2min)
        const record = await pb.collection('example').getOne('RECORD_ID');
        const url = pb.files.getURL(record, record.myPrivateFile, {'token': fileToken});
    `,dart:`
        import 'package:pocketbase/pocketbase.dart';

        final pb = PocketBase('http://127.0.0.1:8090');

        ...

        // authenticate
        await pb.collection('users').authWithPassword('test@example.com', '1234567890');

        // generate a file token
        final fileToken = await pb.files.getToken();

        // retrieve an example protected file url (will be valid ~2min)
        final record = await pb.collection('example').getOne('RECORD_ID');
        final url = pb.files.getURL(record, record.getStringValue('myPrivateFile'), token: fileToken);
    `});var S=n(x,2);a(S,{title:`Storage options`}),i(6),t(e,u)}export{u as component};