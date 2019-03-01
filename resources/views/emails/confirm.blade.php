<!DOCTYPE html>

<html lang="en">

<head>

	<meta charset="utf-8">

	<meta http-equiv="X-UA-Compatible" content="IE=edge">

	<meta name="viewport" content="width=device-width, initial-scale=1">

	<title>MemoryAuth</title>

	<link href="{{ asset('/css/emails.css') }}" rel="stylesheet">

</head>

<body class="emailbody">

    <h1>Hello {{ $name }}</h1> 

    <h2>Welcome to Memory App</h2>

    <p>Click on the link below to confirm your registration.</p>

    <p>

    {{ url('auth/confirm/'.$activation_token) }}

    </p>

</body>

</html>





