class Query{
	/**
	 * 
	 * @param {string that will be created at the end} string 
	 */
	constructor(string){
	  this.q = string;
	}
	/**
	 * "Where" function that is interpreted as where in database or as the part of querySections
	 * @param {*} string 
	 */
	where(string){ 
	  if(!isDirtyAgain) // to control if we are going for the second time when we find new projections but we do not
	  					//want to create new queries but to add only projections 
	  {
		queries[globalIndex] = {
			projections: [],
			querySections: [this.q, string, null, null, null, null, null],
			parentIndex: globalIndex - 1,
			limit: -1,
			offset: 0,
		  };
		  whereQuery = string;
	  }
		return new Query(this.q + string);
	}

	/**
	 * map function to go through every element in a spcific table
	 * @param {*} func 
	 */
	async map(func)
	{
		currentMap++;
		mapObject[globalIndex] = func; // a Map object to set all the map functions
		func(closure, -1); // dry run
		while(dirty)
		{
			await runQueries(queries); 
			dirty = false;
			isSecondMapFinished = false;
			if(resultFromAPI){
				returnValueEnd = resultFromAPI[0].map((record, index)=> { // going through the result
					function dataFunc(value){
						if(!record[value])
						{
							if(!queries[globalIndex].projections.includes(value)){ // if the projection does not exist
								queries[globalIndex].projections.push(value);// add new projection
								dirty = true;
								isDirtyAgain = true;
								resultFromAPICopy = [];
							}
							return undefined;
						}
						else {
							return record[value];
						}
					}

					if(mapObject[0].toString() == func.toString()){ // to call the func for the first level query
						return func(dataFunc, index);
					}
					while(!isSecondMapFinished){
						let recordLength = record[1].length;
						localObject = record[1].map((valueInside, index) => {
							function dataFuncLevel2(value){
								if(!valueInside[value])
								{
									if(!queries[globalIndex].projections.includes(value)){
										queries[globalIndex].projections.push(value);
										dirty = true;
										isDirtyAgain = true;
										resultFromAPICopy = [];
									}
									return undefined;
								}
								else{
									return valueInside[value];
								}
							}
							if (mapObject[1].toString() == func.toString()){ // to call for the second level query
								return func(dataFuncLevel2, index);
							}
						});

					if(recordLength == index + 1){ // to understand if the second level is finished
						isSecondMapFinished = true;
					}
					return localObject;
				}
				});
			}
		// if(isNotFinishedYet){
		// 	dirty = true;
		// }
	}
		return returnValueEnd;
}
	/**
 * group by function that will be considered to group the result
 * @param {*} string 
 */
	groupBy(string){ 
		queries[globalIndex] = {
			projections: [],
			querySections: [this.q, whereQuery, string, null, null, null, null],
			parentIndex: globalIndex - 1,
			limit: -1,
			offset: 0,
		  };
		  groupByQuery = string;
		return  new Query(this.q +string);
	}
	orderBy(string){ 
		queries[globalIndex] = {
			projections: [],
			querySections: [this.q, whereQuery, groupByQuery, string, null, null, null],
			parentIndex: globalIndex - 1,
			limit: -1,
			offset: 0,
		  };
		  orderByQuery = string;
		return  new Query(this.q +string);
	}
  }

	/**
 * function that is used to get the text from map functions
 * @param {*} value 
 */
  function closure(value){
	queries[globalIndex].projections.push(value); // fill the array with projections
  }

  async function runQueries(queriesCreated){
	await fetch("https://brfenergi.se/task-planner/MakumbaQueryServlet", {
	  method: "POST",
	  credentials: 'include',
	  body: "request=" + encodeURIComponent(JSON.stringify({ queries: queriesCreated })) + "&analyzeOnly=false"
	}).then(response =>  response.json())
	  .then(data => {
		//console.log(data);
		resultFromAPI = data.resultData;
		if(JSON.stringify(resultFromAPI) !== JSON.stringify(resultFromAPICopy)){// control if thereare changes in the result to go again throw the map
			dirty = true;
			isNotFinishedYet = true;
		}
		else{
			isNotFinishedYet = false;
		}
		resultFromAPICopy = resultFromAPI;
	  })
	  .catch(e => console.error(e));
  }
  
  function from(string){
	if(!isDirtyAgain)
	{
	  queries[globalIndex + 1] = {
		  projections: [],
		  querySections: [string, undefined, null, null, null, null, null],
		  parentIndex: globalIndex,
		  limit: -1,
		  offset: 0,
		};
		globalIndex ++;
	}
	return new Query(string);
  }
  
  
  let globalIndex = -1; // is used as index for queries
  let queries = []; // array of queries that will be sent
  let whereQuery = undefined;
  let groupByQuery = undefined;
  let orderByQuery = undefined;
  let dirty = true; // boolean value to define if the query is dirty or not
  let resultFromAPI; // the result from API
  let returnValueEnd; // value that will be returned
  let localObject; // value that will be calculated for every map before returning
  let mapObject = new Map(); // Map object that contains all map functions
  let isDirtyAgain = false; // boolean value to control if the value is dirty and not to create again new queries but just to update projections
  let isSecondMapFinished = false; // boolean value to control if it is not finished the second map
  let isNotFinishedYet = true; // boolean value to control if there is yet to be controled at map function
  let resultFromAPICopy;
  let currentMap = 0;
  
  async function testTheProgram(){
    console.log(JSON.stringify(await from("Task t").where("1=1").map(
      data=> ({ 
      customerName:data("t.customer"), 
      days:data("t.days"), 
      end: data("t.days") == "70" ? data("t.endDate") : data("t.startDate") 
      })
      )));
  }

  async function testTheProgram2(){
    console.log(await from("ProductionLine line").map(
    data=>
    ({
        lineName: data("line.name"),
        tasks: from("Task t").where("t.line=line").map(
      data=>
          ({
        customerName:data("t.customer"),
        end: data("t.days") == "70" ? data("t.endDate") : data("t.startDate") ,
          }))
    })));
  }



//   from("ProductionLine line").map(
//     data=>
//     ({
//         lineName: data("line.name"),
//         tasks: from("Task t").where("t.line=line").map(
//       data=>
//           ({
//         customerName:data("t.customer"),
//         end: data("t.days"),
//         endDate: data("t.endDate"),
//         startDate: data("t.startDate") ,
//           }))
//     }));
testTheProgram();