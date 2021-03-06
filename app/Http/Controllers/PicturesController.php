<?php namespace App\Http\Controllers;

use Request;
use Response;
use App\Models\Picture;

class PicturesController extends Controller {

	/**
	 * Display a listing of the resource.
	 *
	 * @return Response
	 */
	public function index()
	{
            try {
                $res = Picture::where('theme', '=', Request::input('theme'))->get(); 
		return Response::json($res);
            } catch (Exception  $e) {
                return Response::json(Array("status"=>"ERROR", "data"=>$e->getMessage()));
            }    
	}


	/**
	 * Show the form for creating a new resource.
	 *
	 * @return Response
	 */
	public function create()
	{
            //
        }


	/**
	 * Store a newly created resource in storage.
	 *
	 * @return Response
	 */
	public function store()
	{
            //
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($id)
	{
            try {
                $res = Picture::findOrFail($id);
                return Response::json($res);
            } catch (Exception  $e) {
                return Response::json(Array("status"=>"ERROR", "data"=>$e->getMessage()));
            }
	}


	/**
	 * Show the form for editing the specified resource.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function edit($id)
	{
            //
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function update($id)
	{
            //
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		//
	}

}
