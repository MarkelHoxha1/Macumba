class Query{
  constructor(string){
    this.q = string;
  }
  where(string){
    queries[globalIndex] = {
        projections: [],
        querySections: [this.q, string, null, null, null, null, null],
        parentIndex: globalIndex - 1,
        limit: -1,
        offset: 0,
      };
    whereQuery = string;
    return new Query(this.q + string);
  }
  async map(func){
        func(closure, -1); // dry run
          while(dirty)
          {
            dirty = false;
            await runQueries(queries);
            returnValueEnd = resultFromAPI[globalIndex].map((record, index)=> {
              function dataFunc(value){
                if(!record[value])
                {
                  if(!queries[globalIndex].projections.includes(value)){
                    queries[globalIndex].projections.push(value);
                    dirty = true;
                  }
                  return undefined;
                }
                else{
                  return record[value];
                }
              }
            return func(dataFunc, index); 
            });
        }
        return returnValueEnd;
  }
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

function getResults(queries){
  return runQueries(queries);
}

function closure(value){
  console.log(value);
  queries[globalIndex].projections.push(value);
}

async function runQueries(queriesCreated){
  console.log(queriesCreated);
  await fetch("https://brfenergi.se/task-planner/MakumbaQueryServlet", {
    method: "POST",
    credentials: 'include',
    body: "request=" + encodeURIComponent(JSON.stringify({ queries: queriesCreated })) + "&analyzeOnly=false"
  }).then(response =>  response.json())
  .then(data => {
    console.log(data);
    resultFromAPI = data.resultData;
  })
  .catch(e => console.error(e));
}

function from(string){
  queries[globalIndex + 1] = {
      projections: [],
      querySections: [string, undefined, null, null, null, null, null],
      parentIndex: globalIndex,
      limit: -1,
      offset: 0,
    };
  globalIndex ++;
  return new Query(string);
}

let globalIndex = -1;
let queries = [];
let whereQuery = undefined;
let groupByQuery = undefined;
let orderByQuery = undefined;
let dirty = true;
let firstMap = false;
let resultFromAPI;
let returnValueEnd;

async function testTheProgram(){
  console.log(JSON.stringify(await from("Task t").where("1=1").map(
    data=> ({ 
      customerName:data("t.customer"), 
      days:data("t.days"), 
      end: data("t.days") == "70" ? data("t.endDate") : data("t.startDate") 
    })
    )));
}

testTheProgram();
